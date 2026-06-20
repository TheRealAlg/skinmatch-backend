import * as fs from "node:fs/promises";
import * as path from "node:path";
import {
  DataConfidence,
  Prisma,
  PrismaClient,
  VerificationStatus
} from "@prisma/client";
import {
  ReviewedCatalogProduct,
  normalizeGtin,
  normalizeKey,
  officialReferenceText,
  parseReviewedProductsPayload,
  productMarketKey,
  splitInciIngredients,
  summarizeImportPlan,
  validateReviewedProducts
} from "./catalog-shared";

export class CatalogImportValidationError extends Error {
  constructor(readonly issues: ReturnType<typeof validateReviewedProducts>) {
    super(`Reviewed catalog import failed validation with ${issues.length} issue(s).`);
  }
}

export type CatalogImportOptions = {
  dryRun?: boolean;
};

export async function readReviewedProductsFile(filePath: string): Promise<ReviewedCatalogProduct[]> {
  const raw = await fs.readFile(filePath, "utf8");
  return parseReviewedProductsPayload(JSON.parse(raw));
}

export async function planReviewedCatalogImport(
  products: ReviewedCatalogProduct[],
  client: PrismaClient
) {
  assertReviewedProducts(products);

  const gtins = products.map((product) => normalizeGtin(product.barcodeGtin));
  const existingProducts = await client.productMarket.findMany({
    where: { barcodeGtin: { in: gtins } },
    select: {
      barcodeGtin: true,
      market: { select: { marketCode: true } }
    }
  });

  const existingKeys = new Set(
    existingProducts.map((product) => productMarketKey(product.market.marketCode, product.barcodeGtin))
  );

  return summarizeImportPlan(products, existingKeys);
}

export async function importReviewedCatalogProducts(
  products: ReviewedCatalogProduct[],
  client: PrismaClient,
  options: CatalogImportOptions = {}
) {
  const summary = await planReviewedCatalogImport(products, client);
  if (options.dryRun) return summary;

  await client.$transaction(async (tx) => {
    for (const product of products) {
      await upsertReviewedProduct(tx, product);
    }
  });

  return summary;
}

function assertReviewedProducts(products: ReviewedCatalogProduct[]) {
  const issues = validateReviewedProducts(products, { requireApprovedForImport: true });
  if (issues.length > 0) {
    throw new CatalogImportValidationError(issues);
  }
}

async function upsertReviewedProduct(
  tx: Prisma.TransactionClient,
  product: ReviewedCatalogProduct
) {
  const marketCode = product.marketCode ?? "TR";
  const locale = product.locale ?? "tr-TR";
  const currencyCode = product.currencyCode ?? "TRY";
  const checkedAt = product.verificationCheckedAt
    ? new Date(product.verificationCheckedAt)
    : new Date();
  const barcodeGtin = normalizeGtin(product.barcodeGtin);
  const brandNormalizedName = product.brandNormalizedName ?? normalizeKey(product.brandName);
  const globalCanonicalName = product.globalCanonicalName ?? product.localProductName;
  const globalNormalizedName = product.globalNormalizedName ?? normalizeKey(globalCanonicalName);
  const normalizedLocalProductName =
    product.normalizedLocalProductName ?? normalizeKey(product.localProductName);

  const market = await tx.market.upsert({
    where: { marketCode },
    update: {
      defaultLocale: locale,
      currencyCode,
      regulatoryContext: marketCode === "TR" ? "TITCK / UTS" : undefined
    },
    create: {
      marketCode,
      defaultLocale: locale,
      currencyCode,
      regulatoryContext: marketCode === "TR" ? "TITCK / UTS" : undefined
    }
  });

  const brand = await tx.brand.upsert({
    where: { normalizedName: brandNormalizedName },
    update: { name: product.brandName },
    create: {
      name: product.brandName,
      normalizedName: brandNormalizedName
    }
  });

  const globalProduct = await tx.productGlobal.upsert({
    where: {
      brandId_normalizedName: {
        brandId: brand.id,
        normalizedName: globalNormalizedName
      }
    },
    update: { canonicalName: globalCanonicalName },
    create: {
      brandId: brand.id,
      canonicalName: globalCanonicalName,
      normalizedName: globalNormalizedName
    }
  });

  const marketProduct = await tx.productMarket.upsert({
    where: {
      marketId_barcodeGtin: {
        marketId: market.id,
        barcodeGtin
      }
    },
    update: {
      productGlobalId: globalProduct.id,
      brandId: brand.id,
      localProductName: product.localProductName,
      normalizedLocalProductName,
      category: product.category,
      rawIngredientText: product.rawIngredientText,
      verificationStatus: product.verificationStatus,
      verificationMethod: product.verificationMethod ?? "reviewed_catalog_import",
      verificationSource: product.sourceName,
      verificationCheckedAt: checkedAt,
      dataConfidence: product.dataConfidence
    },
    create: {
      productGlobalId: globalProduct.id,
      marketId: market.id,
      brandId: brand.id,
      localProductName: product.localProductName,
      normalizedLocalProductName,
      category: product.category,
      barcodeGtin,
      rawIngredientText: product.rawIngredientText,
      verificationStatus: product.verificationStatus,
      verificationMethod: product.verificationMethod ?? "reviewed_catalog_import",
      verificationSource: product.sourceName,
      verificationCheckedAt: checkedAt,
      dataConfidence: product.dataConfidence
    }
  });

  await tx.productMarketImage.deleteMany({ where: { productMarketId: marketProduct.id } });
  if (product.imageUrl) {
    await tx.productMarketImage.create({
      data: {
        productMarketId: marketProduct.id,
        url: product.imageUrl,
        altText: product.imageAltText ?? `${product.localProductName} product image`,
        source: product.sourceName,
        sourceUrl: product.imageSourceUrl,
        usageRightsNote: product.imageUsageRightsNote,
        sortOrder: 0,
        isPrimary: true
      }
    });
  }

  await tx.productRegulatoryCheck.deleteMany({ where: { productMarketId: marketProduct.id } });
  await tx.productRegulatoryCheck.create({
    data: {
      productMarketId: marketProduct.id,
      marketId: market.id,
      status: product.verificationStatus,
      method: product.verificationMethod ?? "reviewed_catalog_import",
      source: product.sourceName,
      sourceUrl: product.sourceUrl,
      checkedAt,
      checkedBy: product.reviewer ?? "catalog_import",
      notes:
        product.reviewNotes ??
        "Reviewed catalog import. This is product data provenance, not medical or safety guidance."
    }
  });

  await tx.productMarketIngredient.deleteMany({ where: { productMarketId: marketProduct.id } });
  const ingredientRows = splitInciIngredients(product.rawIngredientText);
  for (const [index, rawIngredient] of ingredientRows.entries()) {
    const ingredient = await upsertIngredient(tx, rawIngredient, product.ingredientAliases ?? []);
    await tx.productMarketIngredient.create({
      data: {
        productMarketId: marketProduct.id,
        ingredientId: ingredient.id,
        position: index + 1,
        rawText: rawIngredient,
        mappingConfidence: DataConfidence.low
      }
    });
  }
}

async function upsertIngredient(
  tx: Prisma.TransactionClient,
  rawIngredient: string,
  aliases: ReviewedCatalogProduct["ingredientAliases"]
) {
  const normalizedName = normalizeKey(rawIngredient);
  const matchingAlias = aliases?.find(
    (alias) => normalizeKey(alias.inciName) === normalizedName
  );

  const ingredient = await tx.ingredient.upsert({
    where: { normalizedName },
    update: { inciName: rawIngredient },
    create: {
      inciName: rawIngredient,
      normalizedName
    }
  });

  if (matchingAlias?.displayName) {
    await tx.ingredientLocalization.upsert({
      where: {
        ingredientId_locale: {
          ingredientId: ingredient.id,
          locale: matchingAlias.locale
        }
      },
      update: { displayName: matchingAlias.displayName },
      create: {
        ingredientId: ingredient.id,
        locale: matchingAlias.locale,
        displayName: matchingAlias.displayName
      }
    });
  }

  for (const synonym of matchingAlias?.synonyms ?? []) {
    await tx.ingredientSynonym.upsert({
      where: {
        ingredientId_locale_normalizedSynonym: {
          ingredientId: ingredient.id,
          locale: matchingAlias?.locale ?? "und",
          normalizedSynonym: normalizeKey(synonym)
        }
      },
      update: {
        synonym,
        source: "reviewed_catalog_import"
      },
      create: {
        ingredientId: ingredient.id,
        locale: matchingAlias?.locale ?? "und",
        synonym,
        normalizedSynonym: normalizeKey(synonym),
        source: "reviewed_catalog_import"
      }
    });
  }

  return ingredient;
}

async function main() {
  const prisma = new PrismaClient();
  const args = parseArgs(process.argv.slice(2));
  if (!args.file) {
    console.error("Usage: npm run catalog:import:reviewed -- --file path/to/reviewed-products.json");
    await prisma.$disconnect();
    process.exitCode = 1;
    return;
  }

  try {
    const products = await readReviewedProductsFile(path.resolve(process.cwd(), args.file));
    const summary = await importReviewedCatalogProducts(products, prisma, { dryRun: args.dryRun });
    console.log(JSON.stringify({ dryRun: args.dryRun, ...summary }, null, 2));
    console.log("\nOfficial implementation references:\n" + officialReferenceText());
  } catch (error) {
    if (error instanceof CatalogImportValidationError) {
      console.error(error.message);
      console.error(JSON.stringify(error.issues, null, 2));
    } else {
      console.error(error instanceof Error ? error.message : error);
    }
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

function parseArgs(args: string[]) {
  const values = new Map<string, string>();
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) continue;

    const normalized = arg.replace(/^--/, "");
    const [key, ...rest] = normalized.split("=");
    if (rest.length > 0) {
      values.set(key, rest.join("="));
      continue;
    }

    const next = args[index + 1];
    if (next && !next.startsWith("--")) {
      values.set(key, next);
      index += 1;
    } else {
      values.set(key, "true");
    }
  }

  return {
    file: values.get("file"),
    dryRun: values.has("dry-run")
  };
}

if (require.main === module) {
  void main();
}

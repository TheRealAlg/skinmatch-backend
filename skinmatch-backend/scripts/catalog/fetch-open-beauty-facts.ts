import * as fs from "node:fs/promises";
import * as path from "node:path";
import { DataConfidence, VerificationStatus } from "@prisma/client";
import {
  CandidateFile,
  OFFICIAL_CATALOG_REFERENCES,
  ReviewedCatalogProduct,
  mapProductCategory,
  normalizeGtin,
  normalizeKey,
  officialReferenceText,
  toReviewCsv
} from "./catalog-shared";

const defaultQueries = ["serum", "cleanser", "moisturizer", "sunscreen", "toner", "clay mask"];
const defaultFields = [
  "code",
  "product_name",
  "product_name_en",
  "product_name_tr",
  "brands",
  "categories",
  "categories_tags",
  "ingredients_text",
  "ingredients_text_en",
  "ingredients_text_tr",
  "image_front_url",
  "image_url",
  "url"
].join(",");

type OpenBeautyFactsSearchResponse = {
  products?: OpenBeautyFactsProduct[];
};

export type OpenBeautyFactsProduct = {
  code?: string | number;
  product_name?: string;
  product_name_en?: string;
  product_name_tr?: string;
  brands?: string;
  categories?: string;
  categories_tags?: string[];
  ingredients_text?: string;
  ingredients_text_en?: string;
  ingredients_text_tr?: string;
  image_front_url?: string;
  image_url?: string;
  url?: string;
};

export type FetchOpenBeautyFactsOptions = {
  queries: string[];
  limit: number;
  outputDir: string;
};

export type FetchOpenBeautyFactsResult = {
  products: number;
  jsonPath: string;
  csvPath: string;
  candidateFile: CandidateFile;
};

export function normalizeOpenBeautyFactsProduct(
  product: OpenBeautyFactsProduct
): ReviewedCatalogProduct | null {
  const barcodeGtin = normalizeGtin(product.code);
  const localProductName =
    firstText(product.product_name_tr, product.product_name, product.product_name_en) ?? "";
  const brandName = firstText(product.brands?.split(",")[0]) ?? "";
  const rawIngredientText =
    firstText(product.ingredients_text_tr, product.ingredients_text, product.ingredients_text_en) ?? "";

  if (!barcodeGtin || !localProductName || !brandName || !rawIngredientText) return null;

  const sourceUrl = product.url || `https://world.openbeautyfacts.org/product/${barcodeGtin}`;
  const imageUrl = firstText(product.image_front_url, product.image_url);

  return {
    approvedForImport: false,
    marketCode: "TR",
    locale: "tr-TR",
    currencyCode: "TRY",
    brandName,
    brandNormalizedName: normalizeKey(brandName),
    globalCanonicalName: localProductName,
    globalNormalizedName: normalizeKey(localProductName),
    localProductName,
    normalizedLocalProductName: normalizeKey(localProductName),
    category: mapProductCategory([
      localProductName,
      product.categories,
      ...(product.categories_tags ?? [])
    ]),
    barcodeGtin,
    rawIngredientText,
    sourceName: "open_beauty_facts",
    sourceUrl,
    verificationStatus: VerificationStatus.user_submitted,
    verificationMethod: "open_beauty_facts_candidate",
    dataConfidence: DataConfidence.low,
    reviewNotes:
      "Candidate only. Requires manual label/source review and approvedForImport=true before import.",
    ...(imageUrl
      ? {
          imageUrl,
          imageAltText: `${localProductName} product image candidate`,
          imageSourceUrl: sourceUrl,
          imageUsageRightsNote:
            "Open/community image candidate. Confirm license and production reuse rights before import."
        }
      : {})
  };
}

export async function fetchOpenBeautyFactsCandidateFile(
  options: Pick<FetchOpenBeautyFactsOptions, "queries" | "limit">
): Promise<CandidateFile> {
  const candidates = new Map<string, ReviewedCatalogProduct>();

  for (const query of options.queries) {
    const response = await fetch(searchUrl(query, options.limit), {
      headers: {
        "user-agent": "SkinMatchCatalogImporter/0.1 (development; contact: TheRealAlg)"
      }
    });

    if (!response.ok) {
      throw new Error(`Open Beauty Facts request failed for "${query}" with HTTP ${response.status}`);
    }

    const body = (await response.json()) as OpenBeautyFactsSearchResponse;
    for (const product of body.products ?? []) {
      const normalized = normalizeOpenBeautyFactsProduct(product);
      if (normalized) candidates.set(normalized.barcodeGtin, normalized);
    }
  }

  const products = Array.from(candidates.values()).sort((left, right) =>
    left.localProductName.localeCompare(right.localProductName, "tr-TR")
  );

  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      source: "open_beauty_facts",
      queries: options.queries,
      officialReferences: OFFICIAL_CATALOG_REFERENCES
    },
    products
  };
}

export async function fetchOpenBeautyFactsCandidates(
  options: FetchOpenBeautyFactsOptions
): Promise<FetchOpenBeautyFactsResult> {
  const candidateFile = await fetchOpenBeautyFactsCandidateFile(options);

  await fs.mkdir(options.outputDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonPath = path.join(options.outputDir, `open-beauty-facts-${timestamp}.json`);
  const csvPath = path.join(options.outputDir, `open-beauty-facts-${timestamp}-review.csv`);

  await fs.writeFile(jsonPath, `${JSON.stringify(candidateFile, null, 2)}\n`, "utf8");
  await fs.writeFile(csvPath, `${toReviewCsv(candidateFile.products)}\n`, "utf8");

  return {
    products: candidateFile.products.length,
    jsonPath,
    csvPath,
    candidateFile
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await fetchOpenBeautyFactsCandidates(options);
  console.log(JSON.stringify(result, null, 2));
  console.log("\nOfficial implementation references:\n" + officialReferenceText());
}

function parseArgs(args: string[]): FetchOpenBeautyFactsOptions {
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
    queries: (values.get("queries") ?? defaultQueries.join(","))
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    limit: Number(values.get("limit") ?? 25),
    outputDir: path.resolve(process.cwd(), values.get("output-dir") ?? "catalog-candidates")
  };
}

function searchUrl(query: string, limit: number): string {
  const url = new URL("https://world.openbeautyfacts.org/cgi/search.pl");
  url.searchParams.set("search_terms", query);
  url.searchParams.set("search_simple", "1");
  url.searchParams.set("action", "process");
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", String(limit));
  url.searchParams.set("fields", defaultFields);
  return url.toString();
}

function firstText(...values: Array<string | null | undefined>): string | null {
  return values.map((value) => value?.trim()).find((value): value is string => Boolean(value)) ?? null;
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

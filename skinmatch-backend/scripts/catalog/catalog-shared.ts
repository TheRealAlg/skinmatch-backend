import { DataConfidence, VerificationStatus } from "@prisma/client";

export const OFFICIAL_CATALOG_REFERENCES = [
  {
    label: "Open Beauty Facts",
    url: "https://github.com/openfoodfacts/openbeautyfacts"
  },
  {
    label: "UTS citizen product query",
    url: "https://utsuygulama.saglik.gov.tr/UTS/vatandas"
  },
  {
    label: "GS1 Turkiye Verified by GS1",
    url: "https://www.gs1tr.org/view/icerik/verified-by-gs1.php"
  },
  {
    label: "Google Manufacturer Center API",
    url: "https://developers.google.com/manufacturers/reference/rest"
  }
] as const;

export type IngredientAliasInput = {
  inciName: string;
  locale: string;
  displayName?: string;
  description?: string;
  synonyms?: string[];
};

export type ReviewedIngredientMappingInput = {
  rawText: string;
  inciName: string;
  displayNameTr?: string;
  descriptionTr?: string;
  aliases?: string[];
  mappingConfidence?: DataConfidence;
};

export type ReviewedCatalogProduct = {
  approvedForImport: boolean;
  marketCode?: string;
  locale?: string;
  currencyCode?: string;
  brandName: string;
  brandNormalizedName?: string;
  globalCanonicalName?: string;
  globalNormalizedName?: string;
  localProductName: string;
  normalizedLocalProductName?: string;
  category: string;
  barcodeGtin: string;
  rawIngredientText: string;
  sourceName: string;
  sourceUrl: string;
  verificationStatus: VerificationStatus;
  verificationMethod?: string;
  verificationCheckedAt?: string;
  dataConfidence: DataConfidence;
  reviewer?: string;
  reviewNotes?: string;
  imageUrl?: string;
  imageAltText?: string;
  imageSourceUrl?: string;
  imageUsageRightsNote?: string;
  ingredientAliases?: IngredientAliasInput[];
  ingredientMappings?: ReviewedIngredientMappingInput[];
};

export type CandidateFile = {
  metadata: {
    generatedAt: string;
    source: string;
    queries?: string[];
    officialReferences: typeof OFFICIAL_CATALOG_REFERENCES;
  };
  products: ReviewedCatalogProduct[];
};

export type ValidationOptions = {
  requireApprovedForImport?: boolean;
};

export type ValidationIssue = {
  index: number;
  field: string;
  message: string;
};

const knownDataConfidence = new Set<string>(Object.values(DataConfidence));
const knownVerificationStatuses = new Set<string>(Object.values(VerificationStatus));
const openCommunitySources = new Set(["open_beauty_facts", "open_food_facts"]);

export function normalizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function normalizeGtin(value: string | number | null | undefined): string {
  return String(value ?? "").replace(/\D/g, "");
}

export function splitInciIngredients(rawIngredientText: string): string[] {
  const seen = new Set<string>();
  const ingredients: string[] = [];

  for (const rawPart of rawIngredientText.split(",")) {
    const trimmed = rawPart.trim().replace(/\s+/g, " ");
    if (!trimmed) continue;

    const normalized = normalizeKey(trimmed);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    ingredients.push(trimmed);
  }

  return ingredients;
}

export function mapProductCategory(values: Array<string | null | undefined>): string {
  const haystack = values
    .filter(Boolean)
    .join(" ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (hasAny(haystack, ["serum", "ampoule", "essence"])) return "serum";
  if (hasAny(haystack, ["cleanser", "cleansing", "wash", "temiz", "yikama", "nettoyant"])) {
    return "cleanser";
  }
  if (hasAny(haystack, ["sunscreen", "spf", "sun protection", "gunes", "solaire"])) {
    return "sunscreen";
  }
  if (hasAny(haystack, ["moisturizer", "moisturiser", "cream", "krem", "lotion", "nem"])) {
    return "moisturizer";
  }
  if (hasAny(haystack, ["toner", "tonik"])) return "toner";
  if (hasAny(haystack, ["mask", "maske"])) return "mask";
  return "unknown";
}

export function validateReviewedProducts(
  products: ReviewedCatalogProduct[],
  options: ValidationOptions = {}
): ValidationIssue[] {
  return products.flatMap((product, index) => validateReviewedProduct(product, index, options));
}

export function validateReviewedProduct(
  product: ReviewedCatalogProduct,
  index: number,
  options: ValidationOptions = {}
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const requireApproved = options.requireApprovedForImport ?? true;

  requireText(product.brandName, "brandName", index, issues);
  requireText(product.localProductName, "localProductName", index, issues);
  requireText(product.category, "category", index, issues);
  requireText(product.rawIngredientText, "rawIngredientText", index, issues);
  requireText(product.sourceName, "sourceName", index, issues);
  requireHttpUrl(product.sourceUrl, "sourceUrl", index, issues);

  const gtin = normalizeGtin(product.barcodeGtin);
  if (!/^\d{8,14}$/.test(gtin)) {
    issues.push({
      index,
      field: "barcodeGtin",
      message: "GTIN/barcode must contain 8 to 14 digits."
    });
  }

  if (requireApproved && product.approvedForImport !== true) {
    issues.push({
      index,
      field: "approvedForImport",
      message: "Reviewed imports must set approvedForImport=true."
    });
  }

  if (!knownVerificationStatuses.has(product.verificationStatus)) {
    issues.push({
      index,
      field: "verificationStatus",
      message: "Verification status is not supported by the catalog schema."
    });
  }

  if (product.verificationStatus === VerificationStatus.uts_checked) {
    issues.push({
      index,
      field: "verificationStatus",
      message: "UTS checked status is reserved for a later UTS verification adapter."
    });
  }

  if (!knownDataConfidence.has(product.dataConfidence)) {
    issues.push({
      index,
      field: "dataConfidence",
      message: "Data confidence is not supported by the catalog schema."
    });
  }

  if (isOpenCommunitySource(product.sourceName)) {
    if (
      product.verificationStatus !== VerificationStatus.user_submitted &&
      product.verificationStatus !== VerificationStatus.label_reviewed
    ) {
      issues.push({
        index,
        field: "verificationStatus",
        message: "Open/community rows may only be user_submitted or label_reviewed after review."
      });
    }
    if (product.dataConfidence === DataConfidence.high) {
      issues.push({
        index,
        field: "dataConfidence",
        message: "Open/community rows cannot be imported with high confidence."
      });
    }
  }

  if (product.imageUrl) {
    requireHttpUrl(product.imageUrl, "imageUrl", index, issues);
    requireHttpUrl(product.imageSourceUrl, "imageSourceUrl", index, issues);
    requireText(product.imageUsageRightsNote, "imageUsageRightsNote", index, issues);
  }

  if (splitInciIngredients(product.rawIngredientText).length === 0) {
    issues.push({
      index,
      field: "rawIngredientText",
      message: "Raw ingredient text must include at least one parseable ingredient."
    });
  }

  return issues;
}

export function parseReviewedProductsPayload(payload: unknown): ReviewedCatalogProduct[] {
  if (Array.isArray(payload)) return payload as ReviewedCatalogProduct[];
  if (isRecord(payload) && Array.isArray(payload.products)) {
    return payload.products as ReviewedCatalogProduct[];
  }
  throw new Error("Reviewed catalog file must be a JSON array or an object with a products array.");
}

export function toReviewCsv(products: ReviewedCatalogProduct[]): string {
  const columns = [
    "approvedForImport",
    "barcodeGtin",
    "brandName",
    "localProductName",
    "category",
    "verificationStatus",
    "dataConfidence",
    "sourceName",
    "sourceUrl",
    "imageUrl",
    "reviewer",
    "reviewNotes",
    "rawIngredientText"
  ];

  const rows = products.map((product) =>
    columns
      .map((column) => csvCell(String(product[column as keyof ReviewedCatalogProduct] ?? "")))
      .join(",")
  );

  return [columns.join(","), ...rows].join("\n");
}

export function officialReferenceText(): string {
  return OFFICIAL_CATALOG_REFERENCES.map((reference) => `${reference.label}: ${reference.url}`).join("\n");
}

export function summarizeImportPlan(
  products: ReviewedCatalogProduct[],
  existingProductKeys: Set<string>
) {
  let creates = 0;
  let updates = 0;

  for (const product of products) {
    const key = productMarketKey(product.marketCode ?? "TR", product.barcodeGtin);
    if (existingProductKeys.has(key)) updates += 1;
    else creates += 1;
  }

  return {
    total: products.length,
    creates,
    updates,
    skipped: 0
  };
}

export function productMarketKey(marketCode: string, barcodeGtin: string): string {
  return `${marketCode}:${normalizeGtin(barcodeGtin)}`;
}

function requireText(
  value: string | null | undefined,
  field: string,
  index: number,
  issues: ValidationIssue[]
) {
  if (!value || !value.trim()) {
    issues.push({ index, field, message: `${field} is required.` });
  }
}

function requireHttpUrl(
  value: string | null | undefined,
  field: string,
  index: number,
  issues: ValidationIssue[]
) {
  if (!value || !isHttpUrl(value)) {
    issues.push({ index, field, message: `${field} must be an http(s) URL.` });
  }
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isOpenCommunitySource(sourceName: string): boolean {
  return openCommunitySources.has(normalizeKey(sourceName).replace(/-/g, "_"));
}

function hasAny(value: string, needles: string[]): boolean {
  return needles.some((needle) => value.includes(needle));
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

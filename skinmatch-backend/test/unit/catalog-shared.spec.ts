import { DataConfidence, VerificationStatus } from "@prisma/client";
import {
  ReviewedCatalogProduct,
  mapProductCategory,
  splitInciIngredients,
  summarizeImportPlan,
  validateReviewedProducts
} from "../../scripts/catalog/catalog-shared";

const validProduct: ReviewedCatalogProduct = {
  approvedForImport: true,
  brandName: "Example Brand",
  localProductName: "Example Barrier Serum",
  category: "serum",
  barcodeGtin: "8690000000012",
  rawIngredientText: "Aqua, Glycerin, Panthenol",
  sourceName: "brand_feed_fixture",
  sourceUrl: "https://example.org/product",
  verificationStatus: VerificationStatus.label_reviewed,
  dataConfidence: DataConfidence.medium,
  imageUrl: "https://example.org/product.png",
  imageSourceUrl: "https://example.org/product",
  imageUsageRightsNote: "Fixture image rights note."
};

describe("catalog shared helpers", () => {
  it("maps common skincare category text into canonical catalog buckets", () => {
    expect(mapProductCategory(["Niacinamide serum"])).toBe("serum");
    expect(mapProductCategory(["Gentle face wash cleanser"])).toBe("cleanser");
    expect(mapProductCategory(["SPF 50 sun protection"])).toBe("sunscreen");
    expect(mapProductCategory(["Nemlendirici krem"])).toBe("moisturizer");
    expect(mapProductCategory(["Clay mask"])).toBe("mask");
    expect(mapProductCategory(["Unclear kit"])).toBe("unknown");
  });

  it("splits and normalizes INCI text without duplicate mappings", () => {
    expect(splitInciIngredients("Aqua, Glycerin, Aqua,  Panthenol ")).toEqual([
      "Aqua",
      "Glycerin",
      "Panthenol"
    ]);
  });

  it("rejects unapproved, untraceable, or unsafe reviewed import rows", () => {
    const issues = validateReviewedProducts([
      {
        ...validProduct,
        approvedForImport: false,
        sourceUrl: "",
        verificationStatus: VerificationStatus.uts_checked
      }
    ]);

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "approvedForImport" }),
        expect.objectContaining({ field: "sourceUrl" }),
        expect.objectContaining({ field: "verificationStatus" })
      ])
    );
  });

  it("keeps open/community rows conservative", () => {
    const issues = validateReviewedProducts([
      {
        ...validProduct,
        sourceName: "open_beauty_facts",
        verificationStatus: VerificationStatus.retailer_sourced,
        dataConfidence: DataConfidence.high
      }
    ]);

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "verificationStatus" }),
        expect.objectContaining({ field: "dataConfidence" })
      ])
    );
  });

  it("summarizes dry-run create and update counts by market and GTIN", () => {
    expect(
      summarizeImportPlan(
        [
          validProduct,
          {
            ...validProduct,
            barcodeGtin: "8690000000013"
          }
        ],
        new Set(["TR:8690000000012"])
      )
    ).toEqual({
      total: 2,
      creates: 1,
      updates: 1,
      skipped: 0
    });
  });
});

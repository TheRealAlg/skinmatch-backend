import { DataConfidence, VerificationStatus } from "@prisma/client";
import { normalizeOpenBeautyFactsProduct } from "../../scripts/catalog/fetch-open-beauty-facts";

describe("Open Beauty Facts candidate normalization", () => {
  it("normalizes API products into unapproved review candidates", () => {
    const candidate = normalizeOpenBeautyFactsProduct({
      code: "8682773090119",
      product_name: "Niacinamide %10 + Zinc PCA Serum",
      brands: "The Purest Solutions",
      categories: "Face serum",
      ingredients_text: "Aqua, Niacinamide, Zinc PCA",
      image_front_url: "https://images.openbeautyfacts.org/example.jpg",
      url: "https://world.openbeautyfacts.org/product/8682773090119"
    });

    expect(candidate).toEqual(
      expect.objectContaining({
        approvedForImport: false,
        brandName: "The Purest Solutions",
        category: "serum",
        barcodeGtin: "8682773090119",
        verificationStatus: VerificationStatus.user_submitted,
        dataConfidence: DataConfidence.low,
        sourceName: "open_beauty_facts",
        imageSourceUrl: "https://world.openbeautyfacts.org/product/8682773090119"
      })
    );
  });

  it("drops candidates that do not include enough product truth", () => {
    expect(
      normalizeOpenBeautyFactsProduct({
        code: "12345678",
        product_name: "No Ingredient Product",
        brands: "Example"
      })
    ).toBeNull();
  });
});

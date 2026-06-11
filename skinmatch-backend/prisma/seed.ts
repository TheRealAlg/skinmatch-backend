import {
  DataConfidence,
  Prisma,
  PrismaClient,
  VerificationStatus
} from "@prisma/client";

const prisma = new PrismaClient();
const checkedAt = new Date("2026-06-10T00:00:00.000Z");

type IngredientSeed = {
  inciName: string;
  normalizedName: string;
  displayNameTr: string;
  functions: Array<{
    functionKey: string;
    labelTr: string;
    noteTr?: string;
  }>;
  flags?: Array<{
    flagKey: string;
    labelTr: string;
    noteTr: string;
    confidence: DataConfidence;
  }>;
  synonyms?: Array<{
    synonym: string;
    normalizedSynonym: string;
    locale?: string;
  }>;
};

type ProductSeed = {
  brandNormalizedName: string;
  globalCanonicalName: string;
  globalNormalizedName: string;
  localProductName: string;
  normalizedLocalProductName: string;
  category: string;
  barcodeGtin: string;
  rawIngredientText: string;
  verificationStatus: VerificationStatus;
  verificationMethod: string;
  verificationSource: string;
  dataConfidence: DataConfidence;
  imageSlug: string;
  ingredients: Array<{
    normalizedName: string;
    rawText: string;
    mappingConfidence: DataConfidence;
  }>;
};

const brands = [
  { name: "CeraVe", normalizedName: "cerave" },
  { name: "Simple", normalizedName: "simple" },
  { name: "The Purest Solutions", normalizedName: "the-purest-solutions" }
];

const ingredients: IngredientSeed[] = [
  {
    inciName: "Aqua",
    normalizedName: "aqua",
    displayNameTr: "Su",
    functions: [{ functionKey: "solvent", labelTr: "Cozucu" }],
    synonyms: [{ synonym: "Water", normalizedSynonym: "water" }]
  },
  {
    inciName: "Glycerin",
    normalizedName: "glycerin",
    displayNameTr: "Gliserin",
    functions: [{ functionKey: "humectant", labelTr: "Nem tutucu" }]
  },
  {
    inciName: "Niacinamide",
    normalizedName: "niacinamide",
    displayNameTr: "Niasinamid",
    functions: [
      {
        functionKey: "skin_conditioning",
        labelTr: "Cilt bakim destekleyici",
        noteTr: "Uyumluluk yorumu kullanici profili ve urun gecmisi ile birlikte degerlendirilmelidir."
      }
    ],
    flags: [
      {
        flagKey: "active_compatibility_note",
        labelTr: "Aktif icerik notu",
        noteTr: "Bu kayit tani, tedavi veya guvenlik iddiasi degil; yalnizca uyumluluk degerlendirmesinde dikkate alinacak katalog bilgisidir.",
        confidence: DataConfidence.medium
      }
    ]
  },
  {
    inciName: "Zinc PCA",
    normalizedName: "zinc-pca",
    displayNameTr: "Cinko PCA",
    functions: [{ functionKey: "skin_conditioning", labelTr: "Cilt bakim destekleyici" }]
  },
  {
    inciName: "Panthenol",
    normalizedName: "panthenol",
    displayNameTr: "Pantenol",
    functions: [{ functionKey: "humectant", labelTr: "Nem tutucu" }]
  },
  {
    inciName: "Sodium Hyaluronate",
    normalizedName: "sodium-hyaluronate",
    displayNameTr: "Sodyum Hiyaluronat",
    functions: [{ functionKey: "humectant", labelTr: "Nem tutucu" }],
    synonyms: [{ synonym: "Hyaluronic Acid", normalizedSynonym: "hyaluronic-acid" }]
  },
  {
    inciName: "Ceramide NP",
    normalizedName: "ceramide-np",
    displayNameTr: "Seramid NP",
    functions: [{ functionKey: "barrier_lipid", labelTr: "Bariyer lipid bilgisi" }]
  },
  {
    inciName: "Ceramide AP",
    normalizedName: "ceramide-ap",
    displayNameTr: "Seramid AP",
    functions: [{ functionKey: "barrier_lipid", labelTr: "Bariyer lipid bilgisi" }]
  },
  {
    inciName: "Ceramide EOP",
    normalizedName: "ceramide-eop",
    displayNameTr: "Seramid EOP",
    functions: [{ functionKey: "barrier_lipid", labelTr: "Bariyer lipid bilgisi" }]
  },
  {
    inciName: "Cholesterol",
    normalizedName: "cholesterol",
    displayNameTr: "Kolesterol",
    functions: [{ functionKey: "emollient", labelTr: "Yumusatici" }]
  },
  {
    inciName: "Cetearyl Alcohol",
    normalizedName: "cetearyl-alcohol",
    displayNameTr: "Setearil Alkol",
    functions: [{ functionKey: "emollient", labelTr: "Yumusatici" }]
  },
  {
    inciName: "Phenoxyethanol",
    normalizedName: "phenoxyethanol",
    displayNameTr: "Fenoksietanol",
    functions: [{ functionKey: "preservative", labelTr: "Koruyucu" }],
    flags: [
      {
        flagKey: "preservative_watch",
        labelTr: "Koruyucu notu",
        noteTr: "Hassasiyet profili olan kullanicilarda urun gecmisi ve geri bildirimle birlikte izlenir.",
        confidence: DataConfidence.medium
      }
    ]
  },
  {
    inciName: "Ethylhexylglycerin",
    normalizedName: "ethylhexylglycerin",
    displayNameTr: "Etilheksilgliserin",
    functions: [{ functionKey: "preservative_support", labelTr: "Koruyucu destekleyici" }]
  },
  {
    inciName: "Allantoin",
    normalizedName: "allantoin",
    displayNameTr: "Allantoin",
    functions: [{ functionKey: "skin_conditioning", labelTr: "Cilt bakim destekleyici" }]
  },
  {
    inciName: "Cocamidopropyl Betaine",
    normalizedName: "cocamidopropyl-betaine",
    displayNameTr: "Kokamidopropil Betain",
    functions: [{ functionKey: "surfactant", labelTr: "Yuzey aktif" }],
    flags: [
      {
        flagKey: "rinse_off_surfactant_note",
        labelTr: "Durulanan urun notu",
        noteTr: "Durulanan formuller icin profil ve kullanim baglami ile birlikte degerlendirilir.",
        confidence: DataConfidence.low
      }
    ]
  },
  {
    inciName: "Propylene Glycol",
    normalizedName: "propylene-glycol",
    displayNameTr: "Propilen Glikol",
    functions: [{ functionKey: "humectant", labelTr: "Nem tutucu" }]
  },
  {
    inciName: "Carbomer",
    normalizedName: "carbomer",
    displayNameTr: "Karbomer",
    functions: [{ functionKey: "viscosity_control", labelTr: "Kivam duzenleyici" }]
  },
  {
    inciName: "Tocopherol",
    normalizedName: "tocopherol",
    displayNameTr: "Tokoferol",
    functions: [{ functionKey: "antioxidant", labelTr: "Antioksidan islev" }]
  },
  {
    inciName: "Tocopheryl Acetate",
    normalizedName: "tocopheryl-acetate",
    displayNameTr: "Tokoferil Asetat",
    functions: [{ functionKey: "antioxidant", labelTr: "Antioksidan islev" }]
  },
  {
    inciName: "Dimethicone",
    normalizedName: "dimethicone",
    displayNameTr: "Dimetikon",
    functions: [{ functionKey: "emollient", labelTr: "Yumusatici" }]
  },
  {
    inciName: "Petrolatum",
    normalizedName: "petrolatum",
    displayNameTr: "Petrolatum",
    functions: [{ functionKey: "occlusive", labelTr: "Ortu niteliginde yumusatici" }]
  },
  {
    inciName: "Caprylic/Capric Triglyceride",
    normalizedName: "caprylic-capric-triglyceride",
    displayNameTr: "Kaprilik/Kaprik Trigliserit",
    functions: [{ functionKey: "emollient", labelTr: "Yumusatici" }]
  },
  {
    inciName: "Sodium Chloride",
    normalizedName: "sodium-chloride",
    displayNameTr: "Sodyum Klorur",
    functions: [{ functionKey: "viscosity_control", labelTr: "Kivam duzenleyici" }]
  }
];

const products: ProductSeed[] = [
  {
    brandNormalizedName: "cerave",
    globalCanonicalName: "Hydrating Cleanser",
    globalNormalizedName: "hydrating-cleanser",
    localProductName: "Nemlendirici Yuz Temizleyici 236 ml",
    normalizedLocalProductName: "nemlendirici-yuz-temizleyici-236-ml",
    category: "cleanser",
    barcodeGtin: "3337875597180",
    rawIngredientText:
      "Aqua, Glycerin, Cetearyl Alcohol, Ceramide NP, Ceramide AP, Ceramide EOP, Carbomer, Sodium Hyaluronate, Cholesterol, Phenoxyethanol, Tocopherol",
    verificationStatus: VerificationStatus.retailer_sourced,
    verificationMethod: "mvp_seed_retailer_sample",
    verificationSource: "MVP seed dataset for Turkey catalog smoke tests",
    dataConfidence: DataConfidence.medium,
    imageSlug: "cerave-hydrating-cleanser",
    ingredients: [
      "aqua",
      "glycerin",
      "cetearyl-alcohol",
      "ceramide-np",
      "ceramide-ap",
      "ceramide-eop",
      "carbomer",
      "sodium-hyaluronate",
      "cholesterol",
      "phenoxyethanol",
      "tocopherol"
    ].map((normalizedName) => ({
      normalizedName,
      rawText: ingredientRawText(normalizedName),
      mappingConfidence: DataConfidence.medium
    }))
  },
  {
    brandNormalizedName: "cerave",
    globalCanonicalName: "Moisturizing Cream",
    globalNormalizedName: "moisturizing-cream",
    localProductName: "Nemlendirici Krem 340 g",
    normalizedLocalProductName: "nemlendirici-krem-340-g",
    category: "moisturizer",
    barcodeGtin: "3337875597227",
    rawIngredientText:
      "Aqua, Glycerin, Cetearyl Alcohol, Caprylic/Capric Triglyceride, Petrolatum, Ceramide NP, Ceramide AP, Ceramide EOP, Sodium Hyaluronate, Cholesterol, Dimethicone, Phenoxyethanol",
    verificationStatus: VerificationStatus.retailer_sourced,
    verificationMethod: "mvp_seed_retailer_sample",
    verificationSource: "MVP seed dataset for Turkey catalog smoke tests",
    dataConfidence: DataConfidence.medium,
    imageSlug: "cerave-moisturizing-cream",
    ingredients: [
      "aqua",
      "glycerin",
      "cetearyl-alcohol",
      "caprylic-capric-triglyceride",
      "petrolatum",
      "ceramide-np",
      "ceramide-ap",
      "ceramide-eop",
      "sodium-hyaluronate",
      "cholesterol",
      "dimethicone",
      "phenoxyethanol"
    ].map((normalizedName) => ({
      normalizedName,
      rawText: ingredientRawText(normalizedName),
      mappingConfidence: DataConfidence.medium
    }))
  },
  {
    brandNormalizedName: "simple",
    globalCanonicalName: "Kind to Skin Moisturising Facial Wash",
    globalNormalizedName: "kind-to-skin-moisturising-facial-wash",
    localProductName: "Kind to Skin Nemlendirici Yuz Yikama Jeli",
    normalizedLocalProductName: "kind-to-skin-nemlendirici-yuz-yikama-jeli",
    category: "cleanser",
    barcodeGtin: "8710908813903",
    rawIngredientText:
      "Aqua, Cocamidopropyl Betaine, Propylene Glycol, Panthenol, Tocopheryl Acetate, Sodium Chloride, Phenoxyethanol",
    verificationStatus: VerificationStatus.user_submitted,
    verificationMethod: "mvp_seed_user_submitted_sample",
    verificationSource: "MVP seed dataset for Turkey catalog smoke tests",
    dataConfidence: DataConfidence.low,
    imageSlug: "simple-moisturising-facial-wash",
    ingredients: [
      "aqua",
      "cocamidopropyl-betaine",
      "propylene-glycol",
      "panthenol",
      "tocopheryl-acetate",
      "sodium-chloride",
      "phenoxyethanol"
    ].map((normalizedName) => ({
      normalizedName,
      rawText: ingredientRawText(normalizedName),
      mappingConfidence: DataConfidence.medium
    }))
  },
  {
    brandNormalizedName: "the-purest-solutions",
    globalCanonicalName: "Niacinamide 10% + Zinc PCA Serum",
    globalNormalizedName: "niacinamide-10-zinc-pca-serum",
    localProductName: "Niacinamide %10 + Zinc PCA Serum",
    normalizedLocalProductName: "niacinamide-10-zinc-pca-serum",
    category: "serum",
    barcodeGtin: "8682773090119",
    rawIngredientText:
      "Aqua, Niacinamide, Zinc PCA, Panthenol, Sodium Hyaluronate, Allantoin, Phenoxyethanol, Ethylhexylglycerin",
    verificationStatus: VerificationStatus.label_reviewed,
    verificationMethod: "mvp_seed_label_sample",
    verificationSource: "MVP seed dataset for Turkey catalog smoke tests",
    dataConfidence: DataConfidence.medium,
    imageSlug: "the-purest-niacinamide-serum",
    ingredients: [
      "aqua",
      "niacinamide",
      "zinc-pca",
      "panthenol",
      "sodium-hyaluronate",
      "allantoin",
      "phenoxyethanol",
      "ethylhexylglycerin"
    ].map((normalizedName) => ({
      normalizedName,
      rawText: ingredientRawText(normalizedName),
      mappingConfidence: DataConfidence.high
    }))
  }
];

function ingredientRawText(normalizedName: string) {
  return ingredients.find((ingredient) => ingredient.normalizedName === normalizedName)?.inciName ?? normalizedName;
}

export async function seedDatabase(client: PrismaClient = prisma) {
  await client.$transaction(async (tx) => {
    const market = await tx.market.upsert({
      where: { marketCode: "TR" },
      update: {
        defaultLocale: "tr-TR",
        currencyCode: "TRY",
        regulatoryContext: "T\u0130TCK / \u00dcTS"
      },
      create: {
        marketCode: "TR",
        defaultLocale: "tr-TR",
        currencyCode: "TRY",
        regulatoryContext: "T\u0130TCK / \u00dcTS"
      }
    });

    const brandByNormalizedName = new Map<string, { id: string; name: string }>();
    for (const brand of brands) {
      const savedBrand = await tx.brand.upsert({
        where: { normalizedName: brand.normalizedName },
        update: { name: brand.name },
        create: brand
      });
      brandByNormalizedName.set(brand.normalizedName, savedBrand);
    }

    const ingredientByNormalizedName = new Map<string, { id: string; inciName: string }>();
    for (const ingredient of ingredients) {
      const savedIngredient = await tx.ingredient.upsert({
        where: { normalizedName: ingredient.normalizedName },
        update: { inciName: ingredient.inciName },
        create: {
          inciName: ingredient.inciName,
          normalizedName: ingredient.normalizedName
        }
      });

      await tx.ingredientLocalization.upsert({
        where: {
          ingredientId_locale: {
            ingredientId: savedIngredient.id,
            locale: "tr-TR"
          }
        },
        update: {
          displayName: ingredient.displayNameTr
        },
        create: {
          ingredientId: savedIngredient.id,
          locale: "tr-TR",
          displayName: ingredient.displayNameTr
        }
      });

      for (const synonym of ingredient.synonyms ?? []) {
        await tx.ingredientSynonym.upsert({
          where: {
            ingredientId_locale_normalizedSynonym: {
              ingredientId: savedIngredient.id,
              locale: synonym.locale ?? "und",
              normalizedSynonym: synonym.normalizedSynonym
            }
          },
          update: {
            synonym: synonym.synonym,
            source: "mvp_seed"
          },
          create: {
            ingredientId: savedIngredient.id,
            locale: synonym.locale ?? "und",
            synonym: synonym.synonym,
            normalizedSynonym: synonym.normalizedSynonym,
            source: "mvp_seed"
          }
        });
      }

      for (const ingredientFunction of ingredient.functions) {
        await tx.ingredientFunction.upsert({
          where: {
            ingredientId_functionKey: {
              ingredientId: savedIngredient.id,
              functionKey: ingredientFunction.functionKey
            }
          },
          update: {
            labelTr: ingredientFunction.labelTr,
            noteTr: ingredientFunction.noteTr
          },
          create: {
            ingredientId: savedIngredient.id,
            functionKey: ingredientFunction.functionKey,
            labelTr: ingredientFunction.labelTr,
            noteTr: ingredientFunction.noteTr
          }
        });
      }

      for (const flag of ingredient.flags ?? []) {
        await tx.ingredientFlag.upsert({
          where: {
            ingredientId_flagKey: {
              ingredientId: savedIngredient.id,
              flagKey: flag.flagKey
            }
          },
          update: {
            labelTr: flag.labelTr,
            noteTr: flag.noteTr,
            confidence: flag.confidence
          },
          create: {
            ingredientId: savedIngredient.id,
            flagKey: flag.flagKey,
            labelTr: flag.labelTr,
            noteTr: flag.noteTr,
            confidence: flag.confidence
          }
        });
      }

      ingredientByNormalizedName.set(ingredient.normalizedName, savedIngredient);
    }

    for (const product of products) {
      const brand = brandByNormalizedName.get(product.brandNormalizedName);
      if (!brand) {
        throw new Error(`Seed brand ${product.brandNormalizedName} was not created`);
      }

      const globalProduct = await tx.productGlobal.upsert({
        where: {
          brandId_normalizedName: {
            brandId: brand.id,
            normalizedName: product.globalNormalizedName
          }
        },
        update: {
          canonicalName: product.globalCanonicalName
        },
        create: {
          brandId: brand.id,
          canonicalName: product.globalCanonicalName,
          normalizedName: product.globalNormalizedName
        }
      });

      const marketProduct = await tx.productMarket.upsert({
        where: {
          marketId_barcodeGtin: {
            marketId: market.id,
            barcodeGtin: product.barcodeGtin
          }
        },
        update: productMarketWrite(product, brand.id, globalProduct.id, market.id),
        create: productMarketWrite(product, brand.id, globalProduct.id, market.id)
      });

      await tx.productMarketImage.deleteMany({
        where: { productMarketId: marketProduct.id }
      });
      await tx.productMarketImage.create({
        data: {
          productMarketId: marketProduct.id,
          url: `https://example.com/skinmatch-seed/${product.imageSlug}.jpg`,
          altText: `${product.localProductName} seed image`,
          source: "mvp_seed_placeholder",
          sortOrder: 0,
          isPrimary: true
        }
      });

      await tx.productRegulatoryCheck.deleteMany({
        where: { productMarketId: marketProduct.id }
      });
      await tx.productRegulatoryCheck.create({
        data: {
          productMarketId: marketProduct.id,
          marketId: market.id,
          status: product.verificationStatus,
          method: product.verificationMethod,
          source: product.verificationSource,
          checkedAt,
          checkedBy: "seed",
          notes: "Seeded catalog verification state for read API development; not a medical or safety assessment."
        }
      });

      await tx.productMarketIngredient.deleteMany({
        where: { productMarketId: marketProduct.id }
      });
      await tx.productMarketIngredient.createMany({
        data: product.ingredients.map((mapping, index) => {
          const ingredient = ingredientByNormalizedName.get(mapping.normalizedName);
          if (!ingredient) {
            throw new Error(`Seed ingredient ${mapping.normalizedName} was not created`);
          }

          return {
            productMarketId: marketProduct.id,
            ingredientId: ingredient.id,
            position: index + 1,
            rawText: mapping.rawText,
            mappingConfidence: mapping.mappingConfidence
          };
        })
      });
    }
  });
}

function productMarketWrite(
  product: ProductSeed,
  brandId: string,
  productGlobalId: string,
  marketId: string
): Prisma.ProductMarketUncheckedCreateInput {
  return {
    productGlobalId,
    marketId,
    brandId,
    localProductName: product.localProductName,
    normalizedLocalProductName: product.normalizedLocalProductName,
    category: product.category,
    barcodeGtin: product.barcodeGtin,
    rawIngredientText: product.rawIngredientText,
    verificationStatus: product.verificationStatus,
    verificationMethod: product.verificationMethod,
    verificationSource: product.verificationSource,
    verificationCheckedAt: checkedAt,
    dataConfidence: product.dataConfidence
  };
}

if (require.main === module) {
  seedDatabase()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (error) => {
      console.error(error);
      await prisma.$disconnect();
      process.exit(1);
    });
}

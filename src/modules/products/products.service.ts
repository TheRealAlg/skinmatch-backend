import { Injectable, NotFoundException } from "@nestjs/common";
import { DataConfidence, Prisma, VerificationStatus } from "@prisma/client";
import { PrismaService } from "../../common/database/prisma.service";
import { BarcodeLookupQueryDto } from "./dto/barcode-lookup-query.dto";
import { SearchProductsQueryDto } from "./dto/search-products-query.dto";
import {
  ProductSearchService,
  ProductSummaryRecord,
  productSummaryInclude
} from "./search.service";

const productDetailInclude = {
  brand: true,
  productGlobal: true,
  market: true,
  images: {
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }]
  },
  regulatoryChecks: {
    orderBy: { checkedAt: "desc" }
  },
  ingredients: {
    orderBy: { position: "asc" },
    include: {
      ingredient: {
        include: {
          localizations: true,
          synonyms: true,
          functions: true,
          flags: true
        }
      }
    }
  }
} satisfies Prisma.ProductMarketInclude;

type ProductDetailRecord = Prisma.ProductMarketGetPayload<{
  include: typeof productDetailInclude;
}>;

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: ProductSearchService
  ) {}

  async searchProducts(query: SearchProductsQueryDto) {
    const result = await this.searchService.search(query);

    return {
      products: result.products.map((product) => this.toSummary(product)),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit)
      },
      search: {
        marketCode: result.marketCode,
        q: query.q ?? null,
        category: query.category ?? null,
        brand: query.brand ?? null,
        verificationStatus: query.verificationStatus ?? null,
        dataConfidence: query.dataConfidence ?? null,
        engine: "postgres"
      }
    };
  }

  async getProduct(id: string) {
    const product = await this.prisma.productMarket.findUnique({
      where: { id },
      include: productDetailInclude
    });

    if (!product) {
      throw new NotFoundException("Product was not found");
    }

    return {
      product: this.toDetail(product)
    };
  }

  async lookupBarcode(gtin: string, query: BarcodeLookupQueryDto) {
    const marketCode = query.marketCode ?? "TR";
    const product = await this.prisma.productMarket.findFirst({
      where: {
        barcodeGtin: gtin,
        market: { marketCode }
      },
      include: productSummaryInclude
    });

    if (!product) {
      return {
        lookupStatus: "not_found",
        gtin,
        marketCode,
        product: null,
        candidate: null,
        candidateStrategy: "not_implemented"
      };
    }

    return {
      lookupStatus: "found",
      gtin,
      marketCode,
      product: this.toSummary(product),
      candidate: null,
      candidateStrategy: "not_implemented"
    };
  }

  private toSummary(product: ProductSummaryRecord) {
    const primaryImage = product.images[0] ?? null;

    return {
      id: product.id,
      category: product.category,
      localProductName: product.localProductName,
      canonicalName: product.productGlobal.canonicalName,
      barcodeGtin: product.barcodeGtin,
      brand: {
        id: product.brand.id,
        name: product.brand.name
      },
      market: {
        code: product.market.marketCode,
        locale: product.market.defaultLocale,
        currencyCode: product.market.currencyCode
      },
      verification: this.toVerification(product),
      dataConfidence: product.dataConfidence,
      image: primaryImage
        ? {
            url: primaryImage.url,
            altText: primaryImage.altText,
            source: primaryImage.source
          }
        : null
    };
  }

  private toDetail(product: ProductDetailRecord) {
    return {
      ...this.toSummary(product),
      globalProduct: {
        id: product.productGlobal.id,
        canonicalName: product.productGlobal.canonicalName,
        normalizedName: product.productGlobal.normalizedName
      },
      marketProduct: {
        id: product.id,
        marketCode: product.market.marketCode,
        localProductName: product.localProductName,
        normalizedLocalProductName: product.normalizedLocalProductName,
        category: product.category,
        barcodeGtin: product.barcodeGtin
      },
      rawIngredientText: product.rawIngredientText,
      images: product.images.map((image) => ({
        id: image.id,
        url: image.url,
        altText: image.altText,
        source: image.source,
        sortOrder: image.sortOrder,
        isPrimary: image.isPrimary
      })),
      regulatoryChecks: product.regulatoryChecks.map((check) => ({
        id: check.id,
        status: check.status,
        method: check.method,
        source: check.source,
        sourceUrl: check.sourceUrl,
        checkedAt: check.checkedAt,
        checkedBy: check.checkedBy,
        notes: check.notes
      })),
      ingredients: product.ingredients.map((mapping) => {
        const localization =
          mapping.ingredient.localizations.find((item) => item.locale === "tr-TR") ??
          mapping.ingredient.localizations[0] ??
          null;

        return {
          id: mapping.ingredient.id,
          inciName: mapping.ingredient.inciName,
          normalizedName: mapping.ingredient.normalizedName,
          displayName: localization?.displayName ?? mapping.ingredient.inciName,
          displayLocale: localization?.locale ?? null,
          position: mapping.position,
          rawText: mapping.rawText,
          mappingConfidence: mapping.mappingConfidence,
          functions: mapping.ingredient.functions.map((item) => ({
            functionKey: item.functionKey,
            labelTr: item.labelTr,
            noteTr: item.noteTr
          })),
          flags: mapping.ingredient.flags.map((item) => ({
            flagKey: item.flagKey,
            labelTr: item.labelTr,
            noteTr: item.noteTr,
            confidence: item.confidence
          })),
          synonyms: mapping.ingredient.synonyms.map((item) => ({
            locale: item.locale,
            synonym: item.synonym,
            normalizedSynonym: item.normalizedSynonym
          }))
        };
      }),
      recommendationExplanation: this.toRecommendationExplanation(
        product.verificationStatus,
        product.dataConfidence
      )
    };
  }

  private toVerification(product: {
    verificationStatus: VerificationStatus;
    verificationMethod: string;
    verificationSource: string;
    verificationCheckedAt: Date;
  }) {
    return {
      status: product.verificationStatus,
      method: product.verificationMethod,
      source: product.verificationSource,
      checkedAt: product.verificationCheckedAt
    };
  }

  private toRecommendationExplanation(
    verificationStatus: VerificationStatus,
    dataConfidence: DataConfidence
  ) {
    const dataGaps: string[] = [];
    if (verificationStatus !== VerificationStatus.uts_checked) {
      dataGaps.push("Turkey regulatory verification is not recorded as UTS checked.");
    }
    if (dataConfidence !== DataConfidence.high) {
      dataGaps.push("Ingredient mapping confidence is not high for every catalog field.");
    }

    return {
      status: "not_scored",
      confidence: dataConfidence,
      notes: [
        "This MVP catalog response provides compatibility context only.",
        "It is catalog information, not clinical guidance or a product safety rating."
      ],
      dataGaps
    };
  }
}

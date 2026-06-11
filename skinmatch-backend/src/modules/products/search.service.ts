import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/database/prisma.service";
import { SearchProductsQueryDto } from "./dto/search-products-query.dto";

export const productSummaryInclude = {
  brand: true,
  productGlobal: true,
  market: true,
  images: {
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
    take: 1
  }
} satisfies Prisma.ProductMarketInclude;

export type ProductSummaryRecord = Prisma.ProductMarketGetPayload<{
  include: typeof productSummaryInclude;
}>;

const productSearchInclude = {
  brand: true,
  productGlobal: true,
  market: true,
  images: {
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
    take: 1
  },
  ingredients: {
    include: {
      ingredient: {
        include: {
          localizations: true,
          synonyms: true
        }
      }
    }
  }
} satisfies Prisma.ProductMarketInclude;

type ProductSearchRecord = Prisma.ProductMarketGetPayload<{
  include: typeof productSearchInclude;
}>;

@Injectable()
export class ProductSearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: SearchProductsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const marketCode = this.resolveMarketCode(query);
    const where = this.buildWhere(query, marketCode);
    const trimmedQuery = query.q?.trim();

    if (trimmedQuery) {
      const matchedProducts = await this.prisma.productMarket.findMany({
        where,
        include: productSearchInclude,
        orderBy: [{ localProductName: "asc" }, { id: "asc" }]
      });
      const rankedProducts = matchedProducts
        .map((product) => ({
          product,
          score: this.scoreProduct(product, trimmedQuery)
        }))
        .sort((left, right) => this.compareRankedProducts(left, right));

      return {
        products: rankedProducts
          .slice((page - 1) * limit, page * limit)
          .map((ranked) => ranked.product),
        total: rankedProducts.length,
        page,
        limit,
        marketCode
      };
    }

    const [products, total] = await this.prisma.$transaction([
      this.prisma.productMarket.findMany({
        where,
        include: productSummaryInclude,
        orderBy: [{ updatedAt: "desc" }, { localProductName: "asc" }, { id: "asc" }],
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.productMarket.count({ where })
    ]);

    return {
      products,
      total,
      page,
      limit,
      marketCode
    };
  }

  private buildWhere(query: SearchProductsQueryDto, marketCode: string): Prisma.ProductMarketWhereInput {
    const trimmedQuery = query.q?.trim();
    const trimmedCategory = query.category?.trim();
    const trimmedBrand = query.brand?.trim();
    const searchTerms = this.searchTerms(trimmedQuery);

    return {
      market: { marketCode },
      ...(trimmedCategory
        ? { category: { equals: trimmedCategory, mode: "insensitive" } }
        : {}),
      ...(trimmedBrand
        ? { brand: { name: { contains: trimmedBrand, mode: "insensitive" } } }
        : {}),
      ...(query.verificationStatus ? { verificationStatus: query.verificationStatus } : {}),
      ...(query.dataConfidence ? { dataConfidence: query.dataConfidence } : {}),
      ...(trimmedQuery
        ? {
            OR: [
              { localProductName: { contains: trimmedQuery, mode: "insensitive" } },
              ...searchTerms.map((term) => ({
                normalizedLocalProductName: {
                  contains: term,
                  mode: "insensitive" as const
                }
              })),
              { category: { contains: trimmedQuery, mode: "insensitive" } },
              { barcodeGtin: { contains: trimmedQuery } },
              { rawIngredientText: { contains: trimmedQuery, mode: "insensitive" } },
              {
                brand: {
                  name: { contains: trimmedQuery, mode: "insensitive" }
                }
              },
              {
                productGlobal: {
                  canonicalName: { contains: trimmedQuery, mode: "insensitive" }
                }
              },
              ...searchTerms.map((term) => ({
                productGlobal: {
                  normalizedName: { contains: term, mode: "insensitive" as const }
                }
              })),
              {
                ingredients: {
                  some: {
                    OR: [
                      { rawText: { contains: trimmedQuery, mode: "insensitive" } },
                      {
                        ingredient: {
                          inciName: { contains: trimmedQuery, mode: "insensitive" }
                        }
                      },
                      ...searchTerms.map((term) => ({
                        ingredient: {
                          normalizedName: { contains: term, mode: "insensitive" as const }
                        }
                      })),
                      {
                        ingredient: {
                          localizations: {
                            some: {
                              displayName: { contains: trimmedQuery, mode: "insensitive" }
                            }
                          }
                        }
                      },
                      {
                        ingredient: {
                          synonyms: {
                            some: {
                              synonym: { contains: trimmedQuery, mode: "insensitive" }
                            }
                          }
                        }
                      },
                      ...searchTerms.map((term) => ({
                        ingredient: {
                          synonyms: {
                            some: {
                              normalizedSynonym: {
                                contains: term,
                                mode: "insensitive" as const
                              }
                            }
                          }
                        }
                      }))
                    ]
                  }
                }
              }
            ]
          }
        : {})
    };
  }

  private resolveMarketCode(query: SearchProductsQueryDto) {
    return query.marketCode?.trim() || "TR";
  }

  private compareRankedProducts(
    left: { product: ProductSearchRecord; score: number },
    right: { product: ProductSearchRecord; score: number }
  ) {
    if (right.score !== left.score) return right.score - left.score;

    const nameCompare = left.product.localProductName.localeCompare(
      right.product.localProductName,
      "tr-TR"
    );
    if (nameCompare !== 0) return nameCompare;

    return left.product.id.localeCompare(right.product.id);
  }

  private scoreProduct(product: ProductSearchRecord, query: string) {
    const terms = this.searchTerms(query);

    return (
      this.scoreText(product.localProductName, terms, {
        exact: 140,
        prefix: 110,
        contains: 80,
        token: 28
      }) +
      this.scoreText(product.productGlobal.canonicalName, terms, {
        exact: 130,
        prefix: 100,
        contains: 70,
        token: 24
      }) +
      this.scoreText(product.brand.name, terms, {
        exact: 100,
        prefix: 75,
        contains: 50,
        token: 18
      }) +
      this.scoreText(product.category, terms, {
        exact: 90,
        prefix: 65,
        contains: 45,
        token: 16
      }) +
      this.scoreText(product.barcodeGtin, terms, {
        exact: 100,
        prefix: 45,
        contains: 20,
        token: 0
      }) +
      this.scoreText(product.rawIngredientText, terms, {
        exact: 50,
        prefix: 35,
        contains: 24,
        token: 8
      }) +
      product.ingredients.reduce((score, mapping) => {
        const ingredient = mapping.ingredient;

        return (
          score +
          this.scoreText(mapping.rawText, terms, {
            exact: 75,
            prefix: 55,
            contains: 38,
            token: 10
          }) +
          this.scoreText(ingredient.inciName, terms, {
            exact: 85,
            prefix: 60,
            contains: 42,
            token: 12
          }) +
          this.scoreText(ingredient.normalizedName, terms, {
            exact: 80,
            prefix: 58,
            contains: 40,
            token: 12
          }) +
          ingredient.localizations.reduce(
            (localizationScore, localization) =>
              localizationScore +
              this.scoreText(localization.displayName, terms, {
                exact: 75,
                prefix: 55,
                contains: 36,
                token: 10
              }),
            0
          ) +
          ingredient.synonyms.reduce(
            (synonymScore, synonym) =>
              synonymScore +
              this.scoreText(synonym.synonym, terms, {
                exact: 65,
                prefix: 45,
                contains: 30,
                token: 8
              }) +
              this.scoreText(synonym.normalizedSynonym, terms, {
                exact: 60,
                prefix: 42,
                contains: 28,
                token: 8
              }),
            0
          )
        );
      }, 0)
    );
  }

  private scoreText(
    value: string | null | undefined,
    terms: string[],
    weights: { exact: number; prefix: number; contains: number; token: number }
  ) {
    if (!value) return 0;

    const normalizedValue = this.normalize(value);
    const [query, ...tokens] = terms;
    let score = 0;

    if (normalizedValue === query) score += weights.exact;
    else if (normalizedValue.startsWith(query)) score += weights.prefix;
    else if (normalizedValue.includes(query)) score += weights.contains;

    for (const token of tokens) {
      if (normalizedValue.includes(token)) score += weights.token;
    }

    return score;
  }

  private searchTerms(value: string | undefined) {
    if (!value) return [];

    const normalized = this.normalize(value);
    const slug = normalized.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const tokens = normalized.split(/[^a-z0-9]+/).filter(Boolean);

    return Array.from(new Set([normalized, slug, ...tokens].filter(Boolean)));
  }

  private normalize(value: string) {
    return value
      .toLocaleLowerCase("tr-TR")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "");
  }
}

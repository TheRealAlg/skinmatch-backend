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

@Injectable()
export class ProductSearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: SearchProductsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const marketCode = query.marketCode ?? "TR";
    const where = this.buildWhere(query, marketCode);

    const [products, total] = await this.prisma.$transaction([
      this.prisma.productMarket.findMany({
        where,
        include: productSummaryInclude,
        orderBy: [{ updatedAt: "desc" }, { localProductName: "asc" }],
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
              {
                normalizedLocalProductName: {
                  contains: trimmedQuery.toLowerCase(),
                  mode: "insensitive"
                }
              },
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
              }
            ]
          }
        : {})
    };
  }
}

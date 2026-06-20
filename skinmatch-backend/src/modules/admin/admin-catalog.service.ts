import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import * as path from "node:path";
import { CatalogCandidateStatus, DataConfidence, Prisma } from "@prisma/client";
import { PrismaService } from "../../common/database/prisma.service";
import {
  ReviewedCatalogProduct,
  mapProductCategory,
  normalizeGtin,
  normalizeKey,
  splitInciIngredients,
  validateReviewedProduct
} from "../../../scripts/catalog/catalog-shared";
import {
  CatalogImportValidationError,
  importReviewedCatalogProducts
} from "../../../scripts/catalog/import-reviewed";
import { fetchOpenBeautyFactsCandidates as fetchOpenBeautyFactsCandidateFiles } from "../../../scripts/catalog/fetch-open-beauty-facts";
import {
  FetchOpenBeautyFactsCandidatesDto,
  CandidateProductDto,
  ListCandidatesQueryDto,
  ListIngredientsQueryDto,
  ReviewCandidateDto,
  UpsertCategoryDto,
  UpsertIngredientDto,
  UpsertIngredientLocalizationDto
} from "./dto/admin-catalog.dto";

type CandidateIssueDraft = {
  issueKey: string;
  field?: string;
  severity: string;
  message: string;
};

type CandidateDisposition = "created" | "updated" | "skipped";

type ParsedIngredientToken = {
  rawText: string;
  normalizedName: string;
  mappedInciName: string | null;
  mappingConfidence: DataConfidence | null;
  issueKeys: string[];
};

@Injectable()
export class AdminCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async ingestReviewedProducts(products: CandidateProductDto[]) {
    const candidates = [];
    let created = 0;
    let updated = 0;
    let skipped = 0;
    for (const product of products) {
      const result = await this.upsertCandidate(product);
      candidates.push(result.candidate);
      if (result.disposition === "created") created += 1;
      else if (result.disposition === "updated") updated += 1;
      else skipped += 1;
    }

    return {
      importedToQueue: candidates.length,
      created,
      updated,
      skipped,
      candidates
    };
  }

  async fetchOpenBeautyFactsCandidates(dto: FetchOpenBeautyFactsCandidatesDto) {
    const result = await fetchOpenBeautyFactsCandidateFiles({
      queries:
        dto.queries && dto.queries.length > 0
          ? dto.queries
          : ["serum", "cleanser", "moisturizer", "sunscreen", "toner", "mask"],
      limit: dto.limit ?? 25,
      outputDir: path.resolve(process.cwd(), "catalog-candidates")
    });
    const queueResult = await this.ingestReviewedProducts(
      result.candidateFile.products as CandidateProductDto[]
    );

    return {
      source: "open_beauty_facts",
      productsFetched: result.products,
      queued: queueResult.importedToQueue,
      created: queueResult.created,
      updated: queueResult.updated,
      skipped: queueResult.skipped,
      jsonPath: result.jsonPath,
      csvPath: result.csvPath,
      officialReferences: result.candidateFile.metadata.officialReferences,
      candidates: queueResult.candidates
    };
  }

  async listCandidates(query: ListCandidatesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const where: Prisma.CatalogCandidateWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.issueKey
        ? {
            issues: {
              some: {
                issueKey: query.issueKey,
                resolvedAt: null
              }
            }
          }
        : {})
    };
    const [candidates, total] = await this.prisma.$transaction([
      this.prisma.catalogCandidate.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        include: {
          issues: {
            where: { resolvedAt: null },
            orderBy: [{ severity: "asc" }, { issueKey: "asc" }]
          }
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.catalogCandidate.count({ where })
    ]);

    return {
      candidates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async issueSummary() {
    const grouped = await this.prisma.catalogCandidateIssue.groupBy({
      by: ["issueKey", "severity"],
      where: { resolvedAt: null },
      _count: { _all: true },
      orderBy: [{ issueKey: "asc" }]
    });

    return {
      issues: grouped.map((item) => ({
        issueKey: item.issueKey,
        severity: item.severity,
        count: item._count._all
      }))
    };
  }

  async getCandidateReviewWorkspace(id: string) {
    const candidate = await this.getCandidate(id);
    const product = this.payloadToProduct(candidate.payload);
    const ingredientTokens = this.parsedIngredientTokens(product, candidate.issues);
    const existingProduct = await this.prisma.productMarket.findFirst({
      where: {
        barcodeGtin: normalizeGtin(product.barcodeGtin),
        market: { marketCode: product.marketCode ?? "TR" }
      },
      select: {
        id: true,
        localProductName: true,
        brand: { select: { name: true } }
      }
    });

    return {
      candidate,
      draft: product,
      parsedIngredientTokens: ingredientTokens,
      categoryOptions: await this.categoryOptions(product),
      ingredientSuggestions: await this.ingredientSuggestions(ingredientTokens),
      duplicateStatus: {
        importedProductMarketId: candidate.importedProductMarketId ?? existingProduct?.id ?? null,
        alreadyInCatalog: Boolean(existingProduct),
        existingProductName: existingProduct?.localProductName ?? null,
        existingBrandName: existingProduct?.brand.name ?? null
      },
      appPreview: await this.appPreview(product)
    };
  }

  async reviewCandidate(id: string, dto: ReviewCandidateDto) {
    const candidate = await this.prisma.catalogCandidate.findUnique({ where: { id } });
    if (!candidate) throw new NotFoundException("Catalog candidate was not found");

    const payload = this.payloadToProduct(candidate.payload);
    const updatedPayload: ReviewedCatalogProduct = {
      ...payload,
      ...(dto.brandName !== undefined ? { brandName: dto.brandName } : {}),
      ...(dto.localProductName !== undefined ? { localProductName: dto.localProductName } : {}),
      ...(dto.globalCanonicalName !== undefined
        ? { globalCanonicalName: dto.globalCanonicalName }
        : {}),
      ...(dto.barcodeGtin !== undefined ? { barcodeGtin: dto.barcodeGtin } : {}),
      ...(dto.rawIngredientText !== undefined ? { rawIngredientText: dto.rawIngredientText } : {}),
      ...(dto.sourceName !== undefined ? { sourceName: dto.sourceName } : {}),
      ...(dto.sourceUrl !== undefined ? { sourceUrl: dto.sourceUrl } : {}),
      ...(dto.category ? { category: dto.category } : {}),
      ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
      ...(dto.imageSourceUrl !== undefined ? { imageSourceUrl: dto.imageSourceUrl } : {}),
      ...(dto.imageUsageRightsNote !== undefined
        ? { imageUsageRightsNote: dto.imageUsageRightsNote }
        : {}),
      ...(dto.imageAltText !== undefined ? { imageAltText: dto.imageAltText } : {}),
      ...(dto.verificationMethod !== undefined
        ? { verificationMethod: dto.verificationMethod }
        : {}),
      ...(dto.verificationCheckedAt !== undefined
        ? { verificationCheckedAt: dto.verificationCheckedAt }
        : {}),
      ...(dto.ingredientMappings !== undefined
        ? { ingredientMappings: dto.ingredientMappings }
        : {}),
      ...(dto.verificationStatus !== undefined
        ? { verificationStatus: dto.verificationStatus }
        : {}),
      ...(dto.dataConfidence !== undefined ? { dataConfidence: dto.dataConfidence } : {}),
      ...(dto.approvedForImport !== undefined
        ? { approvedForImport: dto.approvedForImport }
        : {}),
      ...(dto.reviewer !== undefined ? { reviewer: dto.reviewer } : {}),
      ...(dto.reviewNotes !== undefined ? { reviewNotes: dto.reviewNotes } : {})
    };
    const issueDrafts = await this.detectIssues(updatedPayload);
    const status =
      dto.status ??
      (updatedPayload.approvedForImport && issueDrafts.length === 0
        ? CatalogCandidateStatus.approved
        : CatalogCandidateStatus.needs_review);

    const saved = await this.prisma.catalogCandidate.update({
      where: { id },
      data: this.candidateWrite(updatedPayload, status),
      include: { issues: true }
    });
    await this.replaceIssues(saved.id, issueDrafts);
    await this.audit("catalog_candidate.review", "CatalogCandidate", saved.id, candidate, saved);

    return this.getCandidate(saved.id);
  }

  async importCandidate(id: string) {
    const candidate = await this.getCandidate(id);
    const product = this.payloadToProduct(candidate.payload);
    const blockingIssues = candidate.issues.filter((issue) => isBlockingIssue(issue));
    if (!product.approvedForImport || blockingIssues.length > 0) {
      throw new BadRequestException("Candidate must be approved and have no unresolved issues before import");
    }

    try {
      await importReviewedCatalogProducts([product], this.prisma);
    } catch (error) {
      if (error instanceof CatalogImportValidationError) {
        throw new BadRequestException({
          message: "Candidate failed reviewed catalog import validation",
          details: error.issues
        });
      }
      throw error;
    }
    const imported = await this.prisma.productMarket.findFirst({
      where: {
        barcodeGtin: normalizeGtin(product.barcodeGtin),
        market: { marketCode: product.marketCode ?? "TR" }
      },
      select: { id: true }
    });
    const updated = await this.prisma.catalogCandidate.update({
      where: { id },
      data: {
        status: CatalogCandidateStatus.imported,
        importedAt: new Date(),
        importedProductMarketId: imported?.id
      },
      include: { issues: true }
    });
    await this.audit("catalog_candidate.import", "CatalogCandidate", id, candidate, updated);

    return {
      candidate: updated,
      productMarketId: imported?.id ?? null
    };
  }

  async importApprovedCandidates() {
    const candidates = await this.prisma.catalogCandidate.findMany({
      where: {
        approvedForImport: true,
        status: CatalogCandidateStatus.approved
      },
      include: { issues: true },
      orderBy: [{ updatedAt: "asc" }]
    });
    const results: Array<{
      candidateId: string;
      status: "imported" | "skipped" | "failed";
      productMarketId?: string | null;
      reason?: string;
    }> = [];
    let imported = 0;
    let skipped = 0;
    let failed = 0;

    for (const candidate of candidates) {
      const blockingIssues = candidate.issues.filter((issue) => isBlockingIssue(issue));
      if (blockingIssues.length > 0) {
        skipped += 1;
        results.push({
          candidateId: candidate.id,
          status: "skipped",
          reason: blockingIssues.map((issue) => issue.issueKey).join(", ")
        });
        continue;
      }

      try {
        const result = await this.importCandidate(candidate.id);
        imported += 1;
        results.push({
          candidateId: candidate.id,
          status: "imported",
          productMarketId: result.productMarketId
        });
      } catch (error) {
        failed += 1;
        results.push({
          candidateId: candidate.id,
          status: "failed",
          reason: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return {
      scanned: candidates.length,
      imported,
      skipped,
      failed,
      results
    };
  }

  async listCategories() {
    return {
      categories: await this.prisma.catalogCategory.findMany({
        orderBy: [{ sortOrder: "asc" }, { key: "asc" }],
        include: {
          localizations: true,
          aliases: true
        }
      })
    };
  }

  async upsertCategory(dto: UpsertCategoryDto) {
    const category = await this.prisma.catalogCategory.upsert({
      where: { key: normalizeKey(dto.key) },
      update: {
        sortOrder: dto.sortOrder ?? 0,
        isActive: true
      },
      create: {
        key: normalizeKey(dto.key),
        sortOrder: dto.sortOrder ?? 0,
        isActive: true
      }
    });

    await this.prisma.catalogCategoryLocalization.upsert({
      where: {
        categoryId_locale: {
          categoryId: category.id,
          locale: "tr-TR"
        }
      },
      update: {
        displayName: dto.displayNameTr,
        description: dto.descriptionTr
      },
      create: {
        categoryId: category.id,
        locale: "tr-TR",
        displayName: dto.displayNameTr,
        description: dto.descriptionTr
      }
    });

    for (const alias of dto.aliases ?? []) {
      await this.prisma.catalogCategoryAlias.upsert({
        where: {
          categoryId_locale_normalizedAlias: {
            categoryId: category.id,
            locale: "tr-TR",
            normalizedAlias: normalizeKey(alias)
          }
        },
        update: { alias, source: "admin" },
        create: {
          categoryId: category.id,
          locale: "tr-TR",
          alias,
          normalizedAlias: normalizeKey(alias),
          source: "admin"
        }
      });
    }

    await this.audit("catalog_category.upsert", "CatalogCategory", category.id, null, dto);
    return this.listCategories();
  }

  async listIngredients(query: ListIngredientsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const where: Prisma.IngredientWhereInput = {
      ...(query.q
        ? {
            OR: [
              { inciName: { contains: query.q, mode: "insensitive" } },
              { normalizedName: { contains: normalizeKey(query.q), mode: "insensitive" } },
              {
                localizations: {
                  some: { displayName: { contains: query.q, mode: "insensitive" } }
                }
              }
            ]
          }
        : {}),
      ...(query.missingTr
        ? {
            localizations: {
              none: { locale: "tr-TR" }
            }
          }
        : {})
    };
    const [ingredients, total] = await this.prisma.$transaction([
      this.prisma.ingredient.findMany({
        where,
        include: {
          localizations: true,
          synonyms: true,
          functions: true,
          flags: true
        },
        orderBy: [{ inciName: "asc" }],
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.ingredient.count({ where })
    ]);

    return {
      ingredients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async upsertIngredient(dto: UpsertIngredientDto) {
    const normalizedName = normalizeKey(dto.inciName);
    const ingredient = await this.prisma.ingredient.upsert({
      where: { normalizedName },
      update: { inciName: dto.inciName },
      create: { normalizedName, inciName: dto.inciName }
    });

    if (dto.displayNameTr || dto.descriptionTr) {
      await this.prisma.ingredientLocalization.upsert({
        where: {
          ingredientId_locale: {
            ingredientId: ingredient.id,
            locale: "tr-TR"
          }
        },
        update: {
          displayName: dto.displayNameTr ?? dto.inciName,
          description: dto.descriptionTr
        },
        create: {
          ingredientId: ingredient.id,
          locale: "tr-TR",
          displayName: dto.displayNameTr ?? dto.inciName,
          description: dto.descriptionTr
        }
      });
    }

    for (const synonym of dto.synonyms ?? []) {
      await this.prisma.ingredientSynonym.upsert({
        where: {
          ingredientId_locale_normalizedSynonym: {
            ingredientId: ingredient.id,
            locale: "tr-TR",
            normalizedSynonym: normalizeKey(synonym)
          }
        },
        update: { synonym, source: "admin" },
        create: {
          ingredientId: ingredient.id,
          locale: "tr-TR",
          synonym,
          normalizedSynonym: normalizeKey(synonym),
          source: "admin"
        }
      });
    }

    await this.audit("ingredient.upsert", "Ingredient", ingredient.id, null, dto);
    return this.prisma.ingredient.findUnique({
      where: { id: ingredient.id },
      include: { localizations: true, synonyms: true, functions: true, flags: true }
    });
  }

  async upsertIngredientLocalization(
    ingredientId: string,
    dto: UpsertIngredientLocalizationDto
  ) {
    const ingredient = await this.prisma.ingredient.findUnique({ where: { id: ingredientId } });
    if (!ingredient) throw new NotFoundException("Ingredient was not found");

    await this.prisma.ingredientLocalization.upsert({
      where: {
        ingredientId_locale: {
          ingredientId,
          locale: "tr-TR"
        }
      },
      update: {
        displayName: dto.displayName,
        description: dto.description
      },
      create: {
        ingredientId,
        locale: "tr-TR",
        displayName: dto.displayName,
        description: dto.description
      }
    });

    for (const synonym of dto.synonyms ?? []) {
      await this.prisma.ingredientSynonym.upsert({
        where: {
          ingredientId_locale_normalizedSynonym: {
            ingredientId,
            locale: "tr-TR",
            normalizedSynonym: normalizeKey(synonym)
          }
        },
        update: {
          synonym,
          source: "admin"
        },
        create: {
          ingredientId,
          locale: "tr-TR",
          synonym,
          normalizedSynonym: normalizeKey(synonym),
          source: "admin"
        }
      });
    }

    await this.audit("ingredient.localization.upsert", "Ingredient", ingredientId, null, dto);
    return this.prisma.ingredient.findUnique({
      where: { id: ingredientId },
      include: { localizations: true, synonyms: true, functions: true, flags: true }
    });
  }

  async getPanelHtml() {
    return adminPanelHtml;
  }

  private async upsertCandidate(product: CandidateProductDto): Promise<{
    candidate: Awaited<ReturnType<AdminCatalogService["getCandidate"]>>;
    disposition: CandidateDisposition;
  }> {
    const reviewedProduct = product as ReviewedCatalogProduct;
    const issueDrafts = await this.detectIssues(reviewedProduct);
    const status =
      reviewedProduct.approvedForImport && issueDrafts.length === 0
        ? CatalogCandidateStatus.approved
        : CatalogCandidateStatus.needs_review;
    const existing = await this.findExistingCandidate(reviewedProduct);
    const disposition: CandidateDisposition = existing ? "updated" : "created";
    if (existing?.status === CatalogCandidateStatus.imported) {
      await this.audit(
        "catalog_candidate.ingest.skipped_already_imported",
        "CatalogCandidate",
        existing.id,
        existing,
        reviewedProduct
      );
      return {
        candidate: await this.getCandidate(existing.id),
        disposition: "skipped"
      };
    }

    const saved = existing
      ? await this.prisma.catalogCandidate.update({
          where: { id: existing.id },
          data: this.candidateWrite(reviewedProduct, status),
          include: { issues: true }
        })
      : await this.prisma.catalogCandidate.create({
          data: this.candidateWrite(reviewedProduct, status),
          include: { issues: true }
        });
    await this.replaceIssues(saved.id, issueDrafts);
    await this.audit(
      "catalog_candidate.ingest",
      "CatalogCandidate",
      saved.id,
      existing,
      reviewedProduct
    );
    return {
      candidate: await this.getCandidate(saved.id),
      disposition
    };
  }

  private async findExistingCandidate(product: ReviewedCatalogProduct) {
    const sourceMatch = await this.prisma.catalogCandidate.findUnique({
      where: {
        sourceName_sourceUrl: {
          sourceName: product.sourceName,
          sourceUrl: product.sourceUrl
        }
      }
    });
    if (sourceMatch) return sourceMatch;

    const barcodeGtin = normalizeGtin(product.barcodeGtin);
    if (!barcodeGtin) return null;

    return this.prisma.catalogCandidate.findFirst({
      where: {
        marketCode: product.marketCode ?? "TR",
        barcodeGtin
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }]
    });
  }

  private async getCandidate(id: string) {
    const candidate = await this.prisma.catalogCandidate.findUnique({
      where: { id },
      include: {
        issues: {
          orderBy: [{ resolvedAt: "asc" }, { issueKey: "asc" }]
        }
      }
    });
    if (!candidate) throw new NotFoundException("Catalog candidate was not found");
    return candidate;
  }

  private parsedIngredientTokens(
    product: ReviewedCatalogProduct,
    issues: Array<{ issueKey: string; field: string | null }>
  ): ParsedIngredientToken[] {
    const mappings = ingredientMappingByRawText(product);
    return splitInciIngredients(product.rawIngredientText).map((rawText) => {
      const normalizedName = normalizeKey(rawText);
      const mapping = mappings.get(normalizedName);
      const issueKeys = issues
        .filter((issue) => issue.field === ingredientIssueField(rawText))
        .map((issue) => issue.issueKey);

      return {
        rawText,
        normalizedName,
        mappedInciName: mapping?.inciName ?? null,
        mappingConfidence: mapping?.mappingConfidence ?? null,
        issueKeys
      };
    });
  }

  private async categoryOptions(product: ReviewedCatalogProduct) {
    const mappedCategory = mapProductCategory([
      product.category,
      product.localProductName,
      product.rawIngredientText
    ]);
    const categories = await this.prisma.catalogCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { key: "asc" }],
      include: {
        localizations: {
          where: { locale: "tr-TR" }
        },
        aliases: {
          where: { locale: "tr-TR" }
        }
      }
    });

    return categories.map((category) => ({
      key: category.key,
      displayNameTr: category.localizations[0]?.displayName ?? category.key,
      descriptionTr: category.localizations[0]?.description ?? null,
      aliases: category.aliases.map((alias) => alias.alias),
      selected: normalizeKey(product.category) === category.key,
      suggested: mappedCategory === category.key
    }));
  }

  private async ingredientSuggestions(tokens: ParsedIngredientToken[]) {
    return Promise.all(
      tokens.map(async (token) => ({
        rawText: token.rawText,
        suggestions: await this.findIngredientSuggestions(token.rawText, token.mappedInciName)
      }))
    );
  }

  private async findIngredientSuggestions(rawText: string, mappedInciName: string | null) {
    const normalizedRaw = normalizeKey(rawText);
    const normalizedMapped = mappedInciName ? normalizeKey(mappedInciName) : null;
    const ingredients = await this.prisma.ingredient.findMany({
      where: {
        OR: [
          { normalizedName: normalizedRaw },
          ...(normalizedMapped ? [{ normalizedName: normalizedMapped }] : []),
          { inciName: { contains: rawText, mode: "insensitive" } },
          {
            synonyms: {
              some: {
                normalizedSynonym: { in: [normalizedRaw, normalizedMapped].filter(isString) }
              }
            }
          }
        ]
      },
      include: {
        localizations: true,
        synonyms: true,
        functions: true,
        flags: true
      },
      take: 8,
      orderBy: [{ inciName: "asc" }]
    });

    return ingredients.map((ingredient) => ({
      id: ingredient.id,
      inciName: ingredient.inciName,
      normalizedName: ingredient.normalizedName,
      displayNameTr:
        ingredient.localizations.find((localization) => localization.locale === "tr-TR")
          ?.displayName ?? null,
      descriptionTr:
        ingredient.localizations.find((localization) => localization.locale === "tr-TR")
          ?.description ?? null,
      aliases: ingredient.synonyms
        .filter((synonym) => synonym.locale === "tr-TR")
        .map((synonym) => synonym.synonym),
      functions: ingredient.functions.map((item) => ({
        functionKey: item.functionKey,
        labelTr: item.labelTr,
        noteTr: item.noteTr
      })),
      flags: ingredient.flags.map((item) => ({
        flagKey: item.flagKey,
        labelTr: item.labelTr,
        noteTr: item.noteTr,
        confidence: item.confidence
      }))
    }));
  }

  private async appPreview(product: ReviewedCatalogProduct) {
    const mappings = ingredientMappingByRawText(product);
    const rawIngredients = splitInciIngredients(product.rawIngredientText);
    const existingIngredients = await this.prisma.ingredient.findMany({
      where: {
        normalizedName: {
          in: rawIngredients.map((rawText) => {
            const mapping = mappings.get(normalizeKey(rawText));
            return normalizeKey(mapping?.inciName ?? rawText);
          })
        }
      },
      include: {
        localizations: true,
        synonyms: true,
        functions: true,
        flags: true
      }
    });
    const ingredientByName = new Map(
      existingIngredients.map((ingredient) => [ingredient.normalizedName, ingredient])
    );

    return {
      id: null,
      category: product.category,
      localProductName: product.localProductName,
      canonicalName: product.globalCanonicalName ?? product.localProductName,
      barcodeGtin: normalizeGtin(product.barcodeGtin),
      brand: { name: product.brandName },
      market: {
        code: product.marketCode ?? "TR",
        locale: product.locale ?? "tr-TR",
        currencyCode: product.currencyCode ?? "TRY"
      },
      verification: {
        status: product.verificationStatus,
        method: product.verificationMethod ?? "reviewed_catalog_import",
        source: product.sourceName,
        checkedAt: product.verificationCheckedAt ?? null
      },
      dataConfidence: product.dataConfidence,
      image: product.imageUrl
        ? {
            url: product.imageUrl,
            altText: product.imageAltText ?? `${product.localProductName} product image`,
            source: product.sourceName,
            sourceUrl: product.imageSourceUrl,
            usageRightsNote: product.imageUsageRightsNote
          }
        : null,
      rawIngredientText: product.rawIngredientText,
      ingredients: rawIngredients.map((rawText, index) => {
        const mapping = mappings.get(normalizeKey(rawText));
        const inciName = mapping?.inciName ?? rawText;
        const existing = ingredientByName.get(normalizeKey(inciName));
        const localization =
          existing?.localizations.find((item) => item.locale === "tr-TR") ??
          existing?.localizations[0] ??
          null;

        return {
          inciName,
          displayName: mapping?.displayNameTr ?? localization?.displayName ?? inciName,
          description: mapping?.descriptionTr ?? localization?.description ?? null,
          position: index + 1,
          rawText,
          mappingConfidence: mapping?.mappingConfidence ?? DataConfidence.low,
          functions:
            existing?.functions.map((item) => ({
              functionKey: item.functionKey,
              labelTr: item.labelTr,
              noteTr: item.noteTr
            })) ?? [],
          flags:
            existing?.flags.map((item) => ({
              flagKey: item.flagKey,
              labelTr: item.labelTr,
              noteTr: item.noteTr,
              confidence: item.confidence
            })) ?? [],
          synonyms: [
            ...(mapping?.aliases ?? []),
            ...(existing?.synonyms.map((synonym) => synonym.synonym) ?? [])
          ]
        };
      }),
      recommendationExplanation: {
        status: "not_scored",
        confidence: product.dataConfidence,
        notes: [
          "This MVP catalog response provides compatibility context only.",
          "It is catalog information, not clinical guidance or a product safety rating."
        ],
        dataGaps: [
          ...(product.verificationStatus === "uts_checked"
            ? []
            : ["Turkey regulatory verification is not recorded as UTS checked."]),
          ...(product.dataConfidence === DataConfidence.high
            ? []
            : ["Ingredient mapping confidence is not high for every catalog field."])
        ]
      }
    };
  }

  private candidateWrite(product: ReviewedCatalogProduct, status: CatalogCandidateStatus) {
    return {
      sourceName: product.sourceName,
      sourceUrl: product.sourceUrl,
      marketCode: product.marketCode ?? "TR",
      locale: product.locale ?? "tr-TR",
      brandName: product.brandName,
      localProductName: product.localProductName,
      category: product.category,
      barcodeGtin: normalizeGtin(product.barcodeGtin),
      rawIngredientText: product.rawIngredientText,
      imageUrl: product.imageUrl,
      imageSourceUrl: product.imageSourceUrl,
      imageUsageRightsNote: product.imageUsageRightsNote,
      payload: toJson(product),
      status,
      approvedForImport: product.approvedForImport,
      verificationStatus: product.verificationStatus,
      dataConfidence: product.dataConfidence,
      reviewer: product.reviewer,
      reviewNotes: product.reviewNotes
    };
  }

  private async detectIssues(product: ReviewedCatalogProduct): Promise<CandidateIssueDraft[]> {
    const issues: CandidateIssueDraft[] = validateReviewedProduct(product, 0, {
      requireApprovedForImport: false
    }).map((issue) => ({
      issueKey: issue.field,
      field: issue.field,
      severity: "error",
      message: issue.message
    }));
    const reviewedMappings = ingredientMappingByRawText(product);

    if (!product.approvedForImport) {
      issues.push({
        issueKey: "not_approved",
        field: "approvedForImport",
        severity: "warning",
        message: "Candidate is not approved for import yet."
      });
    }

    const category = await this.resolveCategory(product.category, [
      product.category,
      product.localProductName,
      product.rawIngredientText
    ]);
    if (!category || category.key === "unknown") {
      issues.push({
        issueKey: "unknown_category",
        field: "category",
        severity: "warning",
        message: "Category was not matched to the managed taxonomy."
      });
    }

    for (const rawIngredient of splitInciIngredients(product.rawIngredientText)) {
      const reviewedMapping = reviewedMappings.get(normalizeKey(rawIngredient));
      const reviewedInciName = reviewedMapping?.inciName?.trim();
      const normalizedName = normalizeKey(reviewedInciName || rawIngredient);
      const existing = await this.prisma.ingredient.findUnique({
        where: { normalizedName },
        include: { localizations: true }
      });
      if (!existing && !reviewedInciName) {
        issues.push({
          issueKey: "unknown_ingredient",
          field: ingredientIssueField(rawIngredient),
          severity: "warning",
          message: `Ingredient needs review: ${rawIngredient}`
        });
      } else if (
        !reviewedMapping?.displayNameTr &&
        !existing?.localizations.some((localization) => localization.locale === "tr-TR")
      ) {
        issues.push({
          issueKey: "missing_tr_localization",
          field: ingredientIssueField(rawIngredient),
          severity: "warning",
          message: `Ingredient is missing Turkish localization: ${rawIngredient}`
        });
      }
    }

    if (!product.imageUrl) {
      issues.push({
        issueKey: "missing_product_image",
        field: "imageUrl",
        severity: "warning",
        message: "Product does not have a usable image URL."
      });
    }

    const barcodeGtin = normalizeGtin(product.barcodeGtin);
    if (barcodeGtin) {
      const imported = await this.prisma.productMarket.findFirst({
        where: {
          barcodeGtin,
          market: { marketCode: product.marketCode ?? "TR" }
        },
        select: { id: true, localProductName: true }
      });
      if (imported) {
        issues.push({
          issueKey: "already_in_catalog",
          field: "barcodeGtin",
          severity: "info",
          message: `Catalog already has this GTIN: ${imported.localProductName}`
        });
      }
    }

    return dedupeIssues(issues);
  }

  private async resolveCategory(key: string, signals: string[]) {
    const normalizedKey = normalizeKey(key);
    const direct = await this.prisma.catalogCategory.findUnique({ where: { key: normalizedKey } });
    if (direct) return direct;

    const alias = await this.prisma.catalogCategoryAlias.findFirst({
      where: {
        normalizedAlias: normalizedKey,
        category: { isActive: true }
      },
      include: { category: true }
    });
    if (alias) return alias.category;

    const mapped = mapProductCategory(signals);
    return this.prisma.catalogCategory.findUnique({ where: { key: mapped } });
  }

  private async replaceIssues(candidateId: string, issues: CandidateIssueDraft[]) {
    await this.prisma.catalogCandidateIssue.deleteMany({ where: { candidateId } });
    if (issues.length === 0) return;
    await this.prisma.catalogCandidateIssue.createMany({
      data: issues.map((issue) => ({
        candidateId,
        issueKey: issue.issueKey,
        field: issue.field,
        severity: issue.severity,
        message: issue.message
      })),
      skipDuplicates: true
    });
  }

  private payloadToProduct(payload: Prisma.JsonValue): ReviewedCatalogProduct {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new BadRequestException("Candidate payload is not a reviewed catalog product");
    }
    return payload as unknown as ReviewedCatalogProduct;
  }

  private async audit(
    action: string,
    targetType: string,
    targetId: string | null,
    beforeSnapshot: unknown,
    afterSnapshot: unknown
  ) {
    await this.prisma.adminAuditLog.create({
      data: {
        action,
        targetType,
        targetId,
        beforeSnapshot: toNullableJson(beforeSnapshot),
        afterSnapshot: toNullableJson(afterSnapshot)
      }
    });
  }
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function toNullableJson(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === null || value === undefined) return Prisma.JsonNull;
  return toJson(value);
}

function ingredientIssueField(rawIngredient: string) {
  return `rawIngredientText.${normalizeKey(rawIngredient)}`;
}

function ingredientMappingByRawText(product: ReviewedCatalogProduct) {
  const mappings = new Map<
    string,
    NonNullable<ReviewedCatalogProduct["ingredientMappings"]>[number]
  >();
  for (const mapping of product.ingredientMappings ?? []) {
    const normalizedRawText = normalizeKey(mapping.rawText);
    if (!normalizedRawText || !mapping.inciName?.trim()) continue;
    mappings.set(normalizedRawText, mapping);
  }
  return mappings;
}

function isString(value: string | null): value is string {
  return typeof value === "string" && value.length > 0;
}

function dedupeIssues(issues: CandidateIssueDraft[]) {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.issueKey}:${issue.field ?? ""}:${issue.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const adminPanelHtml = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SkinMatch Catalog Review</title>
  <style>
    :root { --paper: #fffdf9; --wash: #fbf7f1; --line: #e4d6ca; --ink: #201b18; --muted: #665c55; --accent: #b35b4e; --green: #5f7f6f; --warn: #f6d8a7; }
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; margin: 0; background: var(--wash); color: var(--ink); }
    main { display: grid; grid-template-columns: 380px minmax(0, 1fr); gap: 16px; min-height: 100vh; padding: 16px; }
    aside, section, .panel { background: var(--paper); border: 1px solid var(--line); border-radius: 8px; }
    aside { padding: 14px; overflow: auto; max-height: calc(100vh - 32px); position: sticky; top: 16px; }
    .workspace { display: grid; gap: 14px; align-content: start; }
    .toolbar, .actions, .row, .chips, .summary { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .toolbar { justify-content: space-between; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .wide { grid-column: 1 / -1; }
    label { display: grid; gap: 5px; font-size: 12px; color: var(--muted); font-weight: 700; }
    input, textarea, select { width: 100%; border: 1px solid #dccbbd; border-radius: 8px; padding: 9px; background: white; color: var(--ink); }
    textarea { min-height: 90px; resize: vertical; }
    button { background: var(--accent); color: white; border: 0; border-radius: 8px; padding: 9px 12px; cursor: pointer; font-weight: 700; }
    button.secondary { background: var(--green); }
    button.ghost { background: transparent; color: var(--accent); border: 1px solid #d8bbb2; }
    button:disabled { opacity: .45; cursor: not-allowed; }
    h1, h2, h3 { margin: 0 0 10px; }
    p { color: var(--muted); line-height: 1.45; }
    .panel { padding: 14px; }
    .queue-item { width: 100%; text-align: left; background: white; color: var(--ink); border: 1px solid var(--line); margin: 8px 0; display: grid; gap: 4px; }
    .queue-item.active { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(179,91,78,.14); }
    .issue, .chip, .pill { display: inline-flex; align-items: center; border-radius: 999px; padding: 4px 8px; font-size: 12px; }
    .issue { background: var(--warn); color: #422e12; }
    .issue.info { background: #dce9df; color: #264c3d; }
    .chip { background: #f2e6da; cursor: grab; border: 1px solid #e0cdbb; }
    .chip.selected { background: #d7e7dd; border-color: var(--green); }
    .pill { background: #f3eee8; color: var(--muted); }
    .preview { display: grid; grid-template-columns: 150px 1fr; gap: 14px; align-items: start; }
    .preview img { width: 150px; aspect-ratio: 3 / 4; object-fit: contain; background: #f7efe7; border-radius: 8px; border: 1px solid var(--line); }
    .image-fallback { width: 150px; aspect-ratio: 3 / 4; display: grid; place-items: center; background: #f7efe7; border-radius: 8px; color: var(--muted); text-align: center; padding: 12px; border: 1px solid var(--line); }
    .mapping-row { display: grid; grid-template-columns: minmax(130px, .8fr) repeat(4, minmax(0, 1fr)); gap: 8px; padding: 10px 0; border-top: 1px solid var(--line); }
    .dropzone { min-height: 38px; border: 1px dashed #c7a998; border-radius: 8px; padding: 8px; background: #fffaf4; }
    .dropzone.active { background: #edf6ef; border-color: var(--green); }
    pre { white-space: pre-wrap; background: #221d1a; color: #fff7ed; padding: 12px; border-radius: 8px; max-height: 220px; overflow: auto; }
    @media (max-width: 980px) { main { grid-template-columns: 1fr; } aside { position: static; max-height: none; } .grid, .mapping-row, .preview { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
<main>
  <aside>
    <h1>SkinMatch Catalog Ops</h1>
    <label>Admin key<input id="key" type="password" value="skinmatch-local-admin" /></label>
    <div class="panel">
      <h2>Fetch</h2>
      <label>Queries<input id="fetchQueries" value="serum,cleanser,moisturizer,sunscreen,toner,mask" /></label>
      <label>Limit<input id="fetchLimit" type="number" min="1" max="100" value="25" /></label>
      <p><button onclick="fetchOpenBeautyFacts()">Fetch + queue candidates</button></p>
    </div>
    <div class="panel">
      <h2>Reviewed JSON</h2>
      <textarea id="json" rows="6" placeholder='{"products":[...]}'></textarea>
      <p><input id="file" type="file" accept="application/json" /></p>
      <button onclick="ingest()">Ingest candidates</button>
    </div>
    <div class="toolbar">
      <h2>Queue</h2>
      <button class="ghost" onclick="loadCandidates()">Refresh</button>
    </div>
    <div class="row">
      <select id="statusFilter" onchange="loadCandidates()">
        <option value="">All statuses</option>
        <option value="needs_review">Needs review</option>
        <option value="approved">Approved</option>
        <option value="imported">Imported</option>
        <option value="rejected">Rejected</option>
      </select>
      <button class="secondary" onclick="importApproved()">Import approved</button>
    </div>
    <div id="queue"></div>
  </aside>
  <div class="workspace">
    <section class="panel">
      <div class="toolbar">
        <div>
          <h2 id="editorTitle">Select a candidate</h2>
          <p id="editorSubtitle">Review product truth before it reaches the app.</p>
        </div>
        <div class="actions">
          <button class="ghost" onclick="validateDraft()" id="validateBtn" disabled>Validate</button>
          <button class="secondary" onclick="saveDraft()" id="saveBtn" disabled>Save draft</button>
          <button onclick="approveAndImport()" id="approveImportBtn" disabled>Approve & import</button>
        </div>
      </div>
    </section>
    <section class="panel" id="previewPanel">
      <h2>App preview</h2>
      <div id="preview"></div>
    </section>
    <section class="panel">
      <h2>Product draft</h2>
      <div class="grid" id="draftForm"></div>
    </section>
    <section class="panel">
      <h2>Ingredient mapping</h2>
      <p>Drag a raw chip into a mapping row, or click a chip and use the selected token. Functions and flags are view-only in this slice.</p>
      <div class="chips" id="tokenChips"></div>
      <div id="ingredientMappings"></div>
    </section>
    <section class="panel">
      <h2>Issues</h2>
      <div id="issues"></div>
    </section>
    <section class="panel">
      <h2>Result</h2>
      <pre id="result"></pre>
    </section>
  </div>
</main>
<script>
let candidates = [];
let workspace = null;
let selectedCandidateId = null;
let selectedToken = null;

const headers = () => ({ "content-type": "application/json", "x-skinmatch-admin-key": document.getElementById("key").value });
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
const encodeArg = (value) => encodeURIComponent(String(value ?? ""));
function showResult(value) { document.getElementById("result").textContent = typeof value === "string" ? value : JSON.stringify(value, null, 2); }
async function requestJson(url, options) {
  const response = await fetch(url, options);
  const json = await response.json();
  showResult(json);
  if (!response.ok) throw new Error(json.error?.message || "Request failed");
  return json;
}
document.getElementById("file").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (file) document.getElementById("json").value = await file.text();
});
async function fetchOpenBeautyFacts() {
  try {
    showResult("Fetching candidates...");
    const queries = document.getElementById("fetchQueries").value.split(",").map((item) => item.trim()).filter(Boolean);
    const limit = Number(document.getElementById("fetchLimit").value || 25);
    await requestJson("/api/v1/admin/catalog/candidates/fetch-open-beauty-facts", { method: "POST", headers: headers(), body: JSON.stringify({ queries, limit }) });
    await loadCandidates();
  } catch (error) { showResult(error.message || String(error)); }
}
async function ingest() {
  try {
    const raw = JSON.parse(document.getElementById("json").value);
    const body = Array.isArray(raw) ? { products: raw } : raw;
    await requestJson("/api/v1/admin/catalog/candidates/from-reviewed-products", { method: "POST", headers: headers(), body: JSON.stringify(body) });
    await loadCandidates();
  } catch (error) { showResult(error.message || String(error)); }
}
async function loadCandidates() {
  const status = document.getElementById("statusFilter").value;
  const url = "/api/v1/admin/catalog/candidates?limit=75" + (status ? "&status=" + encodeURIComponent(status) : "");
  const json = await requestJson(url, { headers: headers() });
  candidates = json.data?.candidates ?? [];
  renderQueue();
  if (!selectedCandidateId && candidates.length > 0) await selectCandidate(candidates[0].id);
}
function renderQueue() {
  document.getElementById("queue").innerHTML = candidates.map((candidate) => {
    const issueCount = candidate.issues?.length ?? 0;
    const issueText = issueCount === 1 ? "1 issue" : issueCount + " issues";
    const active = candidate.id === selectedCandidateId ? " active" : "";
    return '<button class="queue-item' + active + '" onclick="selectCandidate(\\'' + candidate.id + '\\')"><strong>' +
      escapeHtml(candidate.localProductName || "Unnamed product") + '</strong><span>' +
      escapeHtml(candidate.brandName || "Unknown brand") + ' - ' + escapeHtml(candidate.barcodeGtin || "No GTIN") +
      '</span><span class="summary"><span class="pill">' + escapeHtml(candidate.status) + '</span><span class="pill">' + issueText + '</span></span></button>';
  }).join("");
}
async function selectCandidate(id) {
  selectedCandidateId = id;
  renderQueue();
  const json = await requestJson("/api/v1/admin/catalog/candidates/" + id + "/review-workspace", { headers: headers() });
  workspace = json.data;
  selectedToken = null;
  renderWorkspace();
}
function renderWorkspace() {
  if (!workspace) return;
  const draft = workspace.draft;
  document.getElementById("editorTitle").textContent = draft.localProductName || "Unnamed product";
  document.getElementById("editorSubtitle").textContent = (draft.brandName || "Unknown brand") + " - " + (draft.barcodeGtin || "No GTIN");
  document.getElementById("saveBtn").disabled = false;
  document.getElementById("validateBtn").disabled = false;
  document.getElementById("approveImportBtn").disabled = hasBlockingIssues();
  renderPreview();
  renderDraftForm();
  renderTokens();
  renderMappings();
  renderIssues();
}
function renderPreview() {
  const preview = workspace.appPreview;
  const image = preview.image?.url ? '<img src="' + escapeHtml(preview.image.url) + '" alt="Product image" />' : '<div class="image-fallback">No product image</div>';
  document.getElementById("preview").innerHTML = '<div class="preview">' + image + '<div><h3>' + escapeHtml(preview.localProductName) + '</h3><p>' +
    escapeHtml(preview.brand?.name || "") + '</p><div class="summary"><span class="pill">' + escapeHtml(preview.category) + '</span><span class="pill">' +
    escapeHtml(preview.verification?.status) + '</span><span class="pill">' + escapeHtml(preview.dataConfidence) + '</span></div><p>' +
    escapeHtml(preview.rawIngredientText) + '</p></div></div>';
}
function renderDraftForm() {
  const draft = workspace.draft;
  const categoryOptions = workspace.categoryOptions.map((category) => '<option value="' + escapeHtml(category.key) + '"' + (category.selected ? " selected" : "") + '>' + escapeHtml(category.displayNameTr) + (category.suggested ? " - suggested" : "") + '</option>').join("");
  document.getElementById("draftForm").innerHTML =
    input("brandName", "Brand", draft.brandName) +
    input("localProductName", "Local product name", draft.localProductName) +
    input("globalCanonicalName", "Global/canonical name", draft.globalCanonicalName || draft.localProductName) +
    input("barcodeGtin", "GTIN / barcode", draft.barcodeGtin) +
    '<label>Category<select id="field_category">' + categoryOptions + '</select></label>' +
    select("verificationStatus", "Verification", draft.verificationStatus, ["unverified","user_submitted","retailer_sourced","label_reviewed","uts_checked"]) +
    select("dataConfidence", "Data confidence", draft.dataConfidence, ["low","medium","high"]) +
    input("verificationMethod", "Verification method", draft.verificationMethod || "reviewed_catalog_import") +
    input("verificationCheckedAt", "Verification checked at", draft.verificationCheckedAt || "") +
    input("imageUrl", "Image URL", draft.imageUrl || "") +
    input("imageSourceUrl", "Image source URL", draft.imageSourceUrl || "") +
    input("imageUsageRightsNote", "Image usage rights note", draft.imageUsageRightsNote || "") +
    input("sourceName", "Source name", draft.sourceName) +
    input("sourceUrl", "Source URL", draft.sourceUrl) +
    '<label class="wide">Raw ingredient text<textarea id="field_rawIngredientText">' + escapeHtml(draft.rawIngredientText || "") + '</textarea></label>' +
    '<label class="wide">Review notes<textarea id="field_reviewNotes">' + escapeHtml(draft.reviewNotes || "") + '</textarea></label>';
}
function input(name, label, value) { return '<label>' + label + '<input id="field_' + name + '" value="' + escapeHtml(value || "") + '" /></label>'; }
function select(name, label, value, options) { return '<label>' + label + '<select id="field_' + name + '">' + options.map((option) => '<option value="' + option + '"' + (option === value ? " selected" : "") + '>' + option + '</option>').join("") + '</select></label>'; }
function renderTokens() {
  document.getElementById("tokenChips").innerHTML = workspace.parsedIngredientTokens.map((token) => '<span class="chip' + (selectedToken === token.rawText ? " selected" : "") + '" draggable="true" ondragstart="dragToken(event, decodeURIComponent(\\'' + encodeArg(token.rawText) + '\\'))" onclick="selectToken(decodeURIComponent(\\'' + encodeArg(token.rawText) + '\\'))">' + escapeHtml(token.rawText) + '</span>').join("");
}
function renderMappings() {
  const mapped = mappingByRawText();
  document.getElementById("ingredientMappings").innerHTML = workspace.parsedIngredientTokens.map((token, index) => {
    const mapping = mapped[token.rawText] || { rawText: token.rawText, inciName: token.mappedInciName || token.rawText, displayNameTr: "", descriptionTr: "", aliases: [], mappingConfidence: token.mappingConfidence || "low" };
    const suggestions = (workspace.ingredientSuggestions.find((item) => item.rawText === token.rawText)?.suggestions || []).map((suggestion) => '<button class="ghost" onclick="useSuggestion(' + index + ', decodeURIComponent(\\'' + encodeArg(suggestion.inciName) + '\\'), decodeURIComponent(\\'' + encodeArg(suggestion.displayNameTr || "") + '\\'), decodeURIComponent(\\'' + encodeArg(suggestion.descriptionTr || "") + '\\'))">' + escapeHtml(suggestion.displayNameTr || suggestion.inciName) + '</button>').join(" ");
    return '<div class="mapping-row"><div class="dropzone" ondragover="allowDrop(event)" ondrop="dropToken(event, ' + index + ')"><strong>' + escapeHtml(mapping.rawText) + '</strong><br><button class="ghost" onclick="useSelectedToken(' + index + ')">Use selected</button></div>' +
      '<label>INCI<input data-map="inciName" data-index="' + index + '" value="' + escapeHtml(mapping.inciName || "") + '" /></label>' +
      '<label>Turkish name<input data-map="displayNameTr" data-index="' + index + '" value="' + escapeHtml(mapping.displayNameTr || "") + '" /></label>' +
      '<label>Turkish description<input data-map="descriptionTr" data-index="' + index + '" value="' + escapeHtml(mapping.descriptionTr || "") + '" /></label>' +
      '<label>Confidence<select data-map="mappingConfidence" data-index="' + index + '"><option value="low"' + selected(mapping.mappingConfidence, "low") + '>low</option><option value="medium"' + selected(mapping.mappingConfidence, "medium") + '>medium</option><option value="high"' + selected(mapping.mappingConfidence, "high") + '>high</option></select></label>' +
      '<label class="wide">Aliases<input data-map="aliases" data-index="' + index + '" value="' + escapeHtml((mapping.aliases || []).join(", ")) + '" /></label><div class="wide">' + suggestions + '</div></div>';
  }).join("");
}
function selected(value, expected) { return value === expected ? " selected" : ""; }
function renderIssues() {
  const issues = workspace.candidate.issues || [];
  document.getElementById("issues").innerHTML = issues.length ? issues.map((issue) => '<span class="issue ' + escapeHtml(issue.severity) + '">' + escapeHtml(issue.issueKey) + ': ' + escapeHtml(issue.message) + '</span>').join(" ") : '<p>No blocking issues.</p>';
}
function dragToken(event, rawText) { event.dataTransfer.setData("text/plain", rawText); }
function allowDrop(event) { event.preventDefault(); }
function dropToken(event, index) { event.preventDefault(); setMappingRawText(index, event.dataTransfer.getData("text/plain")); }
function selectToken(rawText) { selectedToken = rawText; renderTokens(); }
function useSelectedToken(index) { if (selectedToken) setMappingRawText(index, selectedToken); }
function setMappingRawText(index, rawText) {
  const token = workspace.parsedIngredientTokens.find((item) => item.rawText === rawText);
  if (!token) return;
  workspace.parsedIngredientTokens[index] = token;
  renderTokens();
  renderMappings();
}
function useSuggestion(index, inciName, displayNameTr, descriptionTr) {
  document.querySelector('[data-map="inciName"][data-index="' + index + '"]').value = inciName;
  document.querySelector('[data-map="displayNameTr"][data-index="' + index + '"]').value = displayNameTr;
  document.querySelector('[data-map="descriptionTr"][data-index="' + index + '"]').value = descriptionTr;
}
function mappingByRawText() {
  const result = {};
  (workspace.draft.ingredientMappings || []).forEach((mapping) => { result[mapping.rawText] = mapping; });
  return result;
}
function collectMappings() {
  return workspace.parsedIngredientTokens.map((token, index) => {
    const read = (field) => document.querySelector('[data-map="' + field + '"][data-index="' + index + '"]')?.value || "";
    return {
      rawText: token.rawText,
      inciName: read("inciName") || token.rawText,
      displayNameTr: read("displayNameTr"),
      descriptionTr: read("descriptionTr"),
      aliases: read("aliases").split(",").map((item) => item.trim()).filter(Boolean),
      mappingConfidence: read("mappingConfidence") || "low"
    };
  });
}
function collectDraft(approved) {
  const value = (name) => document.getElementById("field_" + name)?.value || "";
  return {
    approvedForImport: approved,
    brandName: value("brandName"),
    localProductName: value("localProductName"),
    globalCanonicalName: value("globalCanonicalName"),
    barcodeGtin: value("barcodeGtin"),
    category: value("category"),
    verificationStatus: value("verificationStatus"),
    dataConfidence: value("dataConfidence"),
    verificationMethod: value("verificationMethod"),
    verificationCheckedAt: value("verificationCheckedAt"),
    imageUrl: value("imageUrl"),
    imageSourceUrl: value("imageSourceUrl"),
    imageUsageRightsNote: value("imageUsageRightsNote"),
    sourceName: value("sourceName"),
    sourceUrl: value("sourceUrl"),
    rawIngredientText: value("rawIngredientText"),
    reviewNotes: value("reviewNotes"),
    reviewer: "admin-panel",
    ingredientMappings: collectMappings()
  };
}
async function saveDraft() {
  await requestJson("/api/v1/admin/catalog/candidates/" + selectedCandidateId + "/review", { method: "PATCH", headers: headers(), body: JSON.stringify(collectDraft(false)) });
  await selectCandidate(selectedCandidateId);
  await loadCandidates();
}
async function validateDraft() { await saveDraft(); }
async function approveAndImport() {
  const review = await requestJson("/api/v1/admin/catalog/candidates/" + selectedCandidateId + "/review", { method: "PATCH", headers: headers(), body: JSON.stringify(collectDraft(true)) });
  await selectCandidate(selectedCandidateId);
  if ((review.data?.issues || []).filter((issue) => issue.severity !== "info").length > 0) return;
  await requestJson("/api/v1/admin/catalog/candidates/" + selectedCandidateId + "/import", { method: "POST", headers: headers() });
  await selectCandidate(selectedCandidateId);
  await loadCandidates();
}
async function importApproved() { await requestJson("/api/v1/admin/catalog/candidates/import-approved", { method: "POST", headers: headers() }); await loadCandidates(); }
function hasBlockingIssues() { return (workspace?.candidate?.issues || []).some((issue) => issue.severity !== "info"); }
loadCandidates().catch((error) => showResult(error.message || String(error)));
</script>
</body>
</html>`;

function isBlockingIssue(issue: { severity: string; resolvedAt?: Date | string | null }) {
  return !issue.resolvedAt && issue.severity !== "info";
}

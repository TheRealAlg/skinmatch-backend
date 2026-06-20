import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import * as path from "node:path";
import { CatalogCandidateStatus, Prisma } from "@prisma/client";
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

  async reviewCandidate(id: string, dto: ReviewCandidateDto) {
    const candidate = await this.prisma.catalogCandidate.findUnique({ where: { id } });
    if (!candidate) throw new NotFoundException("Catalog candidate was not found");

    const payload = this.payloadToProduct(candidate.payload);
    const updatedPayload: ReviewedCatalogProduct = {
      ...payload,
      ...(dto.brandName !== undefined ? { brandName: dto.brandName } : {}),
      ...(dto.localProductName !== undefined ? { localProductName: dto.localProductName } : {}),
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
      const normalizedName = normalizeKey(rawIngredient);
      const existing = await this.prisma.ingredient.findUnique({
        where: { normalizedName },
        include: { localizations: true }
      });
      if (!existing) {
        issues.push({
          issueKey: "unknown_ingredient",
          field: ingredientIssueField(rawIngredient),
          severity: "warning",
          message: `Ingredient needs review: ${rawIngredient}`
        });
      } else if (!existing.localizations.some((localization) => localization.locale === "tr-TR")) {
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
  <title>SkinMatch Catalog Ops</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; background: #fbf7f1; color: #2a2522; }
    main { max-width: 1120px; margin: 0 auto; padding: 24px; }
    section { background: #fffdf9; border: 1px solid #e7d8ca; border-radius: 8px; padding: 16px; margin: 14px 0; }
    textarea, input { width: 100%; box-sizing: border-box; border: 1px solid #dccbbd; border-radius: 8px; padding: 10px; }
    button { background: #b35b4e; color: white; border: 0; border-radius: 8px; padding: 10px 14px; cursor: pointer; }
    button.secondary { background: #5f7f6f; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { border-bottom: 1px solid #eaded2; padding: 8px; text-align: left; vertical-align: top; }
    .issue { display: inline-block; margin: 2px; padding: 3px 6px; border-radius: 999px; background: #f7dfb8; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  </style>
</head>
<body>
<main>
  <h1>SkinMatch Catalog Ops</h1>
  <section>
    <h2>Admin key</h2>
    <input id="key" type="password" placeholder="X-SkinMatch-Admin-Key" value="skinmatch-local-admin" />
  </section>
  <section>
    <h2>Fetch discovery candidates</h2>
    <p>Fetches Open Beauty Facts candidates, writes review files under <code>catalog-candidates/</code>, and queues rows for review. Nothing is imported until approved.</p>
    <div class="row">
      <label>Queries<input id="fetchQueries" value="serum,cleanser,moisturizer,sunscreen,toner,mask" /></label>
      <label>Limit per query<input id="fetchLimit" type="number" min="1" max="100" value="25" /></label>
    </div>
    <p><button onclick="fetchOpenBeautyFacts()">Fetch + queue candidates</button></p>
  </section>
  <section>
    <h2>Drag/drop reviewed JSON</h2>
    <p>Drop a reviewed JSON file or paste JSON with a <code>products</code> array. Rows with missing fields stay in review.</p>
    <textarea id="json" rows="10" placeholder='{"products":[...]}'></textarea>
    <p><input id="file" type="file" accept="application/json" /></p>
    <button onclick="ingest()">Ingest candidates</button>
  </section>
  <section>
    <h2>Result</h2>
    <pre id="result"></pre>
  </section>
  <section>
    <h2>Queue</h2>
    <button onclick="loadCandidates()">Refresh</button>
    <button class="secondary" onclick="importApproved()">Import approved</button>
    <div id="queue"></div>
  </section>
</main>
<script>
const headers = () => ({ "content-type": "application/json", "x-skinmatch-admin-key": document.getElementById("key").value });
function showResult(value) {
  document.getElementById("result").textContent = typeof value === "string" ? value : JSON.stringify(value, null, 2);
}
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
  } catch (error) {
    showResult(error.message || String(error));
  }
}
async function ingest() {
  try {
    const raw = JSON.parse(document.getElementById("json").value);
    const body = Array.isArray(raw) ? { products: raw } : raw;
    await requestJson("/api/v1/admin/catalog/candidates/from-reviewed-products", { method: "POST", headers: headers(), body: JSON.stringify(body) });
    await loadCandidates();
  } catch (error) {
    showResult(error.message || String(error));
  }
}
async function loadCandidates() {
  const json = await requestJson("/api/v1/admin/catalog/candidates?limit=50", { headers: headers() });
  const candidates = json.data?.candidates ?? [];
  document.getElementById("queue").innerHTML = "<table><thead><tr><th>Product</th><th>Status</th><th>Issues</th><th>Actions</th></tr></thead><tbody>" + candidates.map((candidate) => {
    const issues = candidate.issues.map((issue) => '<span class="issue">' + issue.issueKey + '</span>').join(" ");
    return '<tr><td><b>' + (candidate.localProductName || "") + '</b><br>' + (candidate.brandName || "") + '<br>' + (candidate.barcodeGtin || "") + '</td><td>' + candidate.status + '</td><td>' + issues + '</td><td><button class="secondary" onclick="approve(\\'' + candidate.id + '\\')">Approve</button> <button onclick="importCandidate(\\'' + candidate.id + '\\')">Import</button></td></tr>';
  }).join("") + "</tbody></table>";
}
async function approve(id) {
  await requestJson("/api/v1/admin/catalog/candidates/" + id + "/review", { method: "PATCH", headers: headers(), body: JSON.stringify({ approvedForImport: true, reviewer: "admin-panel" }) });
  await loadCandidates();
}
async function importCandidate(id) {
  await requestJson("/api/v1/admin/catalog/candidates/" + id + "/import", { method: "POST", headers: headers() });
  await loadCandidates();
}
async function importApproved() {
  await requestJson("/api/v1/admin/catalog/candidates/import-approved", { method: "POST", headers: headers() });
  await loadCandidates();
}
loadCandidates().catch((error) => showResult(error.message || String(error)));
</script>
</body>
</html>`;

function isBlockingIssue(issue: { severity: string; resolvedAt?: Date | string | null }) {
  return !issue.resolvedAt && issue.severity !== "info";
}

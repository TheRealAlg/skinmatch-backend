import "reflect-metadata";
import helmet from "helmet";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { DataConfidence, VerificationStatus } from "@prisma/client";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/common/database/prisma.service";
import { HttpErrorFilter } from "../../src/common/errors/http-error.filter";
import { ResponseEnvelopeInterceptor } from "../../src/common/interceptors/response-envelope.interceptor";
import { seedDatabase } from "../../prisma/seed";

type Envelope<T> = {
  data: T | null;
  meta: { requestId?: string };
  error: { code: string; message: string | string[]; details: unknown } | null;
};

type JsonResponse<T> = {
  status: number;
  body: Envelope<T>;
};

type CandidateResponse = {
  importedToQueue: number;
  candidates: Array<{
    id: string;
    status: string;
    approvedForImport: boolean;
    localProductName: string;
    issues: Array<{ issueKey: string; message: string }>;
  }>;
};

type CandidateListResponse = {
  candidates: Array<{
    id: string;
    status: string;
    importedProductMarketId: string | null;
    issues: Array<{ issueKey: string; message: string }>;
  }>;
};

describe("Admin catalog ops API (e2e)", () => {
  let app: INestApplication;
  let baseUrl: string;
  let prisma: PrismaService;
  const adminKey = "skinmatch-local-admin";
  const gtin = "8690000000098";

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.AUTH_PROVIDER = "mock";
    process.env.ALLOW_MOCK_AUTH = "true";
    process.env.DEFAULT_MARKET_CODE = "TR";
    process.env.DEFAULT_LOCALE = "tr-TR";
    process.env.ADMIN_API_KEY = adminKey;
    process.env.JWT_SECRET ??= "test-jwt-secret-for-admin-catalog-e2e";

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.use(helmet());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
      })
    );
    app.useGlobalFilters(new HttpErrorFilter());
    app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());

    await app.listen(0);
    baseUrl = await app.getUrl();

    prisma = app.get(PrismaService);
    await seedDatabase(prisma);
    await prisma.catalogCandidateIssue.deleteMany({
      where: { candidate: { barcodeGtin: gtin } }
    });
    await prisma.catalogCandidate.deleteMany({ where: { barcodeGtin: gtin } });
    await prisma.productMarket.deleteMany({ where: { barcodeGtin: gtin } });
    await prisma.ingredient.deleteMany({ where: { normalizedName: "madecassoside" } });
    await prisma.catalogCategory.deleteMany({ where: { key: "mystery-category" } });
  });

  afterAll(async () => {
    await app.close();
  });

  async function requestJson<T>(
    path: string,
    init: RequestInit = {},
    includeAdminKey = true
  ): Promise<JsonResponse<T>> {
    const response = await fetch(`${baseUrl}/api/v1${path}`, {
      ...init,
      headers: {
        ...(init.body ? { "content-type": "application/json" } : {}),
        ...(includeAdminKey ? { "x-skinmatch-admin-key": adminKey } : {}),
        ...(init.headers ?? {})
      }
    });

    return {
      status: response.status,
      body: (await response.json()) as Envelope<T>
    };
  }

  it("requires the admin key", async () => {
    const response = await requestJson<CandidateListResponse>(
      "/admin/catalog/candidates",
      {},
      false
    );

    expect(response.status).toBe(401);
    expect(response.body.error?.code).toBe("Unauthorized");
  });

  it("serves the browser admin panel without requiring a custom header", async () => {
    const rootResponse = await fetch(`${baseUrl}/api/v1/admin`, {
      redirect: "manual"
    });
    expect(rootResponse.status).toBe(302);
    expect(rootResponse.headers.get("location")).toBe("/api/v1/admin/catalog/panel");

    const panelResponse = await fetch(`${baseUrl}/api/v1/admin/catalog/panel`);
    expect(panelResponse.status).toBe(200);
    expect(panelResponse.headers.get("content-type")).toContain("text/html");
    expect(panelResponse.headers.get("content-security-policy")).toContain("script-src");
    const panelHtml = await panelResponse.text();
    expect(panelHtml).toContain("SkinMatch Catalog Ops");
    expect(panelHtml).toContain("Fetch + queue candidates");
    expect(panelHtml).toContain("Ingest candidates");
  });

  it("queues reviewed candidates, surfaces issues, approves, imports, and preserves Turkish curation", async () => {
    const ingestResponse = await requestJson<CandidateResponse>(
      "/admin/catalog/candidates/from-reviewed-products",
      {
        method: "POST",
        body: JSON.stringify({
          products: [
            {
              approvedForImport: false,
              brandName: "Ops Test",
              localProductName: "Mystery Barrier Gel",
              category: "mystery-category",
              barcodeGtin: gtin,
              rawIngredientText: "Aqua, Madecassoside",
              sourceName: "admin_fixture",
              sourceUrl: "https://example.org/admin-fixture/mystery-barrier-gel",
              verificationStatus: VerificationStatus.label_reviewed,
              dataConfidence: DataConfidence.medium,
              imageUrl: "https://example.org/admin-fixture/mystery-barrier-gel.png",
              imageSourceUrl: "https://example.org/admin-fixture/mystery-barrier-gel",
              imageUsageRightsNote: "Admin e2e fixture image."
            }
          ]
        })
      }
    );

    expect(ingestResponse.status).toBe(201);
    const candidate = ingestResponse.body.data?.candidates[0];
    expect(candidate).toEqual(
      expect.objectContaining({
        approvedForImport: false,
        status: "needs_review"
      })
    );
    expect(candidate?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ issueKey: "not_approved" }),
        expect.objectContaining({ issueKey: "unknown_category" }),
        expect.objectContaining({ issueKey: "unknown_ingredient" })
      ])
    );

    const categoryResponse = await requestJson(
      "/admin/catalog/categories",
      {
        method: "POST",
        body: JSON.stringify({
          key: "mystery-category",
          displayNameTr: "Deneme kategorisi",
          descriptionTr: "Yalnızca admin e2e testi için kullanılan kategori.",
          aliases: ["mystery category"]
        })
      }
    );
    expect(categoryResponse.status).toBe(201);

    const ingredientResponse = await requestJson<{ id: string }>(
      "/admin/catalog/ingredients",
      {
        method: "POST",
        body: JSON.stringify({
          inciName: "Madecassoside"
        })
      }
    );
    expect(ingredientResponse.status).toBe(201);

    const localizationResponse = await requestJson(
      `/admin/catalog/ingredients/${ingredientResponse.body.data?.id}/localizations/tr-TR`,
      {
        method: "PATCH",
        body: JSON.stringify({
          displayName: "Madekasosid",
          description: "Yatıştırıcı bakım odağıyla formüllerde yer alabilir.",
          synonyms: ["Madecassoside"]
        })
      }
    );
    expect(localizationResponse.status).toBe(200);

    const reviewResponse = await requestJson<CandidateResponse["candidates"][0]>(
      `/admin/catalog/candidates/${candidate?.id}/review`,
      {
        method: "PATCH",
        body: JSON.stringify({
          approvedForImport: true,
          reviewer: "admin-e2e",
          category: "mystery-category"
        })
      }
    );
    expect(reviewResponse.status).toBe(200);
    expect(reviewResponse.body.data?.status).toBe("approved");
    expect(reviewResponse.body.data?.issues).toHaveLength(0);

    const importResponse = await requestJson<{ productMarketId: string | null }>(
      `/admin/catalog/candidates/${candidate?.id}/import`,
      { method: "POST" }
    );
    expect(importResponse.status).toBe(201);
    expect(importResponse.body.data?.productMarketId).toEqual(expect.any(String));

    const product = await prisma.productMarket.findUnique({
      where: {
        marketId_barcodeGtin: {
          marketId: (await prisma.market.findUniqueOrThrow({ where: { marketCode: "TR" } })).id,
          barcodeGtin: gtin
        }
      },
      include: {
        ingredients: { include: { ingredient: { include: { localizations: true } } } },
        images: true
      }
    });

    expect(product).toEqual(
      expect.objectContaining({
        barcodeGtin: gtin,
        category: "mystery-category"
      })
    );
    expect(product?.images[0]).toEqual(
      expect.objectContaining({
        sourceUrl: "https://example.org/admin-fixture/mystery-barrier-gel",
        usageRightsNote: "Admin e2e fixture image."
      })
    );
    expect(
      product?.ingredients.some((mapping) =>
        mapping.ingredient.localizations.some(
          (localization) =>
            localization.locale === "tr-TR" && localization.displayName === "Madekasosid"
        )
      )
    ).toBe(true);
  });
});

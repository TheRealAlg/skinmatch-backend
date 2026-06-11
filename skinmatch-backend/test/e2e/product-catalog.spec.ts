import "reflect-metadata";
import helmet from "helmet";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/common/database/prisma.service";
import { HttpErrorFilter } from "../../src/common/errors/http-error.filter";
import { ResponseEnvelopeInterceptor } from "../../src/common/interceptors/response-envelope.interceptor";
import { seedDatabase } from "../../prisma/seed";

type Envelope<T> = {
  data: T | null;
  meta: { requestId?: string };
  error: { code: string; message: string; details: unknown } | null;
};

type JsonResponse<T> = {
  status: number;
  body: Envelope<T>;
};

type SearchResponse = {
  products: Array<{
    id: string;
    localProductName: string;
    barcodeGtin: string;
    brand: { name: string };
    verification: { status: string };
    dataConfidence: string;
  }>;
  pagination: { page: number; limit: number; total: number; totalPages: number };
  search: { marketCode: string; engine: string };
};

type ProductDetailResponse = {
  product: {
    id: string;
    localProductName: string;
    barcodeGtin: string;
    brand: { name: string };
    marketProduct: { marketCode: string; barcodeGtin: string };
    verification: { status: string; method: string; source: string; checkedAt: string };
    dataConfidence: string;
    rawIngredientText: string;
    ingredients: Array<{
      inciName: string;
      displayName: string;
      functions: Array<{ functionKey: string; labelTr: string | null }>;
      flags: Array<{ flagKey: string; noteTr: string | null }>;
    }>;
    recommendationExplanation: {
      status: string;
      notes: string[];
      dataGaps: string[];
    };
  };
};

type BarcodeLookupResponse = {
  lookupStatus: "found" | "not_found";
  gtin: string;
  marketCode: string;
  product: { id: string; barcodeGtin: string } | null;
  candidate: null;
  candidateStrategy: "not_implemented";
};

describe("Product catalog read API (e2e)", () => {
  let app: INestApplication;
  let baseUrl: string;
  let productId: string;
  const niacinamideGtin = "8682773090119";

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.AUTH_PROVIDER = "mock";
    process.env.ALLOW_MOCK_AUTH = "true";
    process.env.DEFAULT_MARKET_CODE = "TR";
    process.env.DEFAULT_LOCALE = "tr-TR";
    process.env.JWT_SECRET ??= "test-jwt-secret-for-product-catalog-e2e";

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

    const prisma = app.get(PrismaService);
    await seedDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  async function requestJson<T>(path: string): Promise<JsonResponse<T>> {
    const response = await fetch(`${baseUrl}/api/v1${path}`);

    return {
      status: response.status,
      body: (await response.json()) as Envelope<T>
    };
  }

  it("searches Turkey-market products with Postgres fallback filters", async () => {
    const response = await requestJson<SearchResponse>(
      "/products/search?q=niacinamide&category=serum&brand=Purest&verificationStatus=label_reviewed&dataConfidence=medium&limit=10"
    );

    expect(response.status).toBe(200);
    expect(response.body.error).toBeNull();
    expect(response.body.meta.requestId).toEqual(expect.any(String));
    expect(response.body.data?.search).toEqual(
      expect.objectContaining({
        marketCode: "TR",
        engine: "postgres"
      })
    );
    expect(response.body.data?.pagination).toEqual(
      expect.objectContaining({
        page: 1,
        limit: 10,
        total: expect.any(Number)
      })
    );
    expect(response.body.data?.products).toHaveLength(1);
    productId = response.body.data?.products[0].id ?? "";
    expect(response.body.data?.products).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          localProductName: "Niacinamide %10 + Zinc PCA Serum",
          barcodeGtin: niacinamideGtin,
          brand: expect.objectContaining({ name: "The Purest Solutions" }),
          verification: expect.objectContaining({ status: "label_reviewed" }),
          dataConfidence: "medium"
        })
      ])
    );

    expect(productId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it("ranks Postgres fallback search results across names, categories, and localized ingredients", async () => {
    const cleanserResponse = await requestJson<SearchResponse>(
      "/products/search?q=cleanser&limit=10"
    );

    expect(cleanserResponse.status).toBe(200);
    const cleanserNames =
      cleanserResponse.body.data?.products.map((product) => product.localProductName) ?? [];
    const ceraVeCleanserIndex = cleanserNames.indexOf(
      "Nemlendirici Yuz Temizleyici 236 ml"
    );
    const simpleCleanserIndex = cleanserNames.indexOf(
      "Kind to Skin Nemlendirici Yuz Yikama Jeli"
    );
    expect(ceraVeCleanserIndex).toBeGreaterThanOrEqual(0);
    expect(simpleCleanserIndex).toBeGreaterThanOrEqual(0);
    expect(ceraVeCleanserIndex).toBeLessThan(simpleCleanserIndex);

    const localizedIngredientResponse = await requestJson<SearchResponse>(
      "/products/search?q=Sodyum%20Hiyaluronat&limit=10"
    );
    expect(localizedIngredientResponse.status).toBe(200);
    expect(
      localizedIngredientResponse.body.data?.products.map((product) => product.localProductName)
    ).toEqual(
      expect.arrayContaining([
        "Nemlendirici Yuz Temizleyici 236 ml",
        "Nemlendirici Krem 340 g",
        "Niacinamide %10 + Zinc PCA Serum"
      ])
    );

    const firstPage = await requestJson<SearchResponse>(
      "/products/search?q=cerave&page=1&limit=1"
    );
    const secondPage = await requestJson<SearchResponse>(
      "/products/search?q=cerave&page=2&limit=1"
    );
    const firstPageAgain = await requestJson<SearchResponse>(
      "/products/search?q=cerave&page=1&limit=1"
    );
    const firstId = firstPage.body.data?.products[0]?.id;
    const secondId = secondPage.body.data?.products[0]?.id;

    expect(firstPage.status).toBe(200);
    expect(secondPage.status).toBe(200);
    expect(firstPage.body.data?.pagination).toEqual(
      expect.objectContaining({ page: 1, limit: 1, totalPages: expect.any(Number) })
    );
    expect(secondPage.body.data?.pagination).toEqual(
      expect.objectContaining({ page: 2, limit: 1, totalPages: expect.any(Number) })
    );
    expect(firstId).toBeDefined();
    expect(secondId).toBeDefined();
    expect(secondId).not.toBe(firstId);
    expect(firstPageAgain.body.data?.products[0]?.id).toBe(firstId);
  });

  it("returns product detail with localized ingredients, functions, flags, and no scoring claims", async () => {
    const response = await requestJson<ProductDetailResponse>(`/products/${productId}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: {
        product: expect.objectContaining({
          id: productId,
          barcodeGtin: niacinamideGtin,
          brand: expect.objectContaining({ id: expect.any(String), name: "The Purest Solutions" }),
          marketProduct: expect.objectContaining({
            marketCode: "TR",
            barcodeGtin: niacinamideGtin
          }),
          verification: expect.objectContaining({
            status: "label_reviewed",
            method: "mvp_seed_label_sample",
            source: "MVP seed dataset for Turkey catalog smoke tests",
            checkedAt: expect.any(String)
          }),
          dataConfidence: "medium",
          rawIngredientText: expect.stringContaining("Niacinamide"),
          recommendationExplanation: expect.objectContaining({
            status: "not_scored",
            notes: expect.arrayContaining([
              "This MVP catalog response provides compatibility context only."
            ])
          })
        })
      },
      meta: { requestId: expect.any(String) },
      error: null
    });

    const ingredients = response.body.data?.product.ingredients ?? [];
    expect(ingredients).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          inciName: "Niacinamide",
          displayName: "Niasinamid",
          functions: expect.arrayContaining([
            expect.objectContaining({ functionKey: "skin_conditioning" })
          ]),
          flags: expect.arrayContaining([
            expect.objectContaining({ flagKey: "active_compatibility_note" })
          ])
        })
      ])
    );
    expect(JSON.stringify(response.body.data?.product.recommendationExplanation)).not.toMatch(
      /\b(cure|treats|diagnoses|toxicity|chemical-free)\b/i
    );
  });

  it("looks up a product by Turkey-market barcode", async () => {
    const response = await requestJson<BarcodeLookupResponse>(
      `/products/barcode/${niacinamideGtin}`
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: {
        lookupStatus: "found",
        gtin: niacinamideGtin,
        marketCode: "TR",
        product: expect.objectContaining({
          id: productId,
          barcodeGtin: niacinamideGtin
        }),
        candidate: null,
        candidateStrategy: "not_implemented"
      },
      meta: { requestId: expect.any(String) },
      error: null
    });
  });

  it("returns not_found for an unknown barcode without unsafe candidate matching", async () => {
    const response = await requestJson<BarcodeLookupResponse>(
      "/products/barcode/0000000000000"
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: {
        lookupStatus: "not_found",
        gtin: "0000000000000",
        marketCode: "TR",
        product: null,
        candidate: null,
        candidateStrategy: "not_implemented"
      },
      meta: { requestId: expect.any(String) },
      error: null
    });
  });
});

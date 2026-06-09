import "reflect-metadata";
import helmet from "helmet";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { readFileSync } from "fs";
import { join } from "path";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/common/database/prisma.service";
import { HttpErrorFilter } from "../../src/common/errors/http-error.filter";
import { ResponseEnvelopeInterceptor } from "../../src/common/interceptors/response-envelope.interceptor";

type Envelope<T> = {
  data: T | null;
  meta: { requestId?: string };
  error: { code: string; message: string; details: unknown } | null;
};

type JsonResponse<T> = {
  status: number;
  body: Envelope<T>;
};

type SkinProfileFixture = {
  skinType: string;
  goals: Array<{ goalKey: string; priority: number }>;
  knownTriggers: Array<{ triggerKey: string; severity: string }>;
} & Record<string, unknown>;

describe("Sprint 1 API flow (e2e)", () => {
  let app: INestApplication;
  let baseUrl: string;
  let prisma: PrismaService;
  let createdUserId: string | undefined;

  const profile = JSON.parse(
    readFileSync(join(process.cwd(), "test", "fixtures", "skin-profile.valid.json"), "utf8")
  ) as SkinProfileFixture;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.AUTH_PROVIDER = "mock";
    process.env.ALLOW_MOCK_AUTH = "true";
    process.env.DEFAULT_MARKET_CODE = "TR";
    process.env.DEFAULT_LOCALE = "tr-TR";
    process.env.JWT_SECRET ??= "test-jwt-secret-for-sprint1-e2e";

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

    await prisma.market.upsert({
      where: { marketCode: "TR" },
      update: {
        defaultLocale: "tr-TR",
        currencyCode: "TRY",
        regulatoryContext: "TİTCK / ÜTS"
      },
      create: {
        marketCode: "TR",
        defaultLocale: "tr-TR",
        currencyCode: "TRY",
        regulatoryContext: "TİTCK / ÜTS"
      }
    });
  });

  afterAll(async () => {
    if (createdUserId) {
      await prisma.userKnownTrigger.deleteMany({
        where: { profile: { userId: createdUserId } }
      });
      await prisma.userSkinGoal.deleteMany({
        where: { profile: { userId: createdUserId } }
      });
      await prisma.userSkinProfile.deleteMany({ where: { userId: createdUserId } });
      await prisma.userConsent.deleteMany({ where: { userId: createdUserId } });
      await prisma.user.deleteMany({ where: { id: createdUserId } });
    }

    await app.close();
  });

  async function requestJson<T>(
    method: string,
    path: string,
    body?: unknown,
    accessToken?: string
  ): Promise<JsonResponse<T>> {
    const headers: Record<string, string> = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    if (body !== undefined) headers["Content-Type"] = "application/json";

    const response = await fetch(`${baseUrl}/api/v1${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });

    return {
      status: response.status,
      body: (await response.json()) as Envelope<T>
    };
  }

  it("requires skin profile consent before writing and returns the saved profile after consent", async () => {
    const health = await requestJson<{ status: string; service: string }>("GET", "/health");
    expect(health.status).toBe(200);
    expect(health.body).toEqual({
      data: {
        status: "ok",
        service: "skincare-backend"
      },
      meta: {
        requestId: expect.any(String)
      },
      error: null
    });

    const session = await requestJson<{
      user: { id: string; defaultMarket: string; locale: string };
      accessToken: string;
    }>("POST", "/auth/session", {
      idToken: `e2e-${crypto.randomUUID()}`
    });
    expect(session.status).toBe(201);
    expect(session.body.data).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({
          defaultMarket: "TR",
          locale: "tr-TR"
        }),
        accessToken: expect.any(String)
      })
    );

    const accessToken = session.body.data?.accessToken;
    createdUserId = session.body.data?.user.id;
    expect(accessToken).toBeDefined();
    expect(createdUserId).toBeDefined();

    const consentsBefore = await requestJson<{ consents: unknown[] }>(
      "GET",
      "/me/consents",
      undefined,
      accessToken
    );
    expect(consentsBefore.status).toBe(200);
    expect(consentsBefore.body).toEqual({
      data: { consents: [] },
      meta: { requestId: expect.any(String) },
      error: null
    });

    const blockedWrite = await requestJson(
      "PUT",
      "/me/skin-profile",
      profile,
      accessToken
    );
    expect(blockedWrite.status).toBe(400);
    expect(blockedWrite.body).toEqual({
      data: null,
      meta: { requestId: expect.any(String) },
      error: {
        code: "CONSENT_REQUIRED",
        message: "skin_profile_processing consent is required",
        details: [{ consentType: "skin_profile_processing" }]
      }
    });

    const consent = await requestJson(
      "POST",
      "/me/consents",
      {
        consentType: "skin_profile_processing",
        consentVersion: "v1",
        status: "accepted",
        locale: "tr-TR",
        marketCode: "TR"
      },
      accessToken
    );
    expect(consent.status).toBe(201);
    expect(consent.body).toEqual({
      data: expect.objectContaining({
        consentType: "skin_profile_processing",
        consentVersion: "v1",
        status: "accepted",
        locale: "tr-TR",
        marketCode: "TR",
        acceptedAt: expect.any(String),
        revokedAt: null
      }),
      meta: { requestId: expect.any(String) },
      error: null
    });

    const savedProfile = await requestJson<{
      profile: {
        skinType: string;
        goals: Array<{ goalKey: string; priority: number }>;
        triggers: Array<{ triggerKey: string; severity: string }>;
      };
    }>("PUT", "/me/skin-profile", profile, accessToken);
    expect(savedProfile.status).toBe(200);
    expect(savedProfile.body.error).toBeNull();
    expect(savedProfile.body.meta.requestId).toEqual(expect.any(String));
    expect(savedProfile.body.data?.profile).toEqual(
      expect.objectContaining({
        skinType: profile.skinType,
        goals: expect.arrayContaining(
          profile.goals.map((goal) =>
            expect.objectContaining({
              goalKey: goal.goalKey,
              priority: goal.priority
            })
          )
        ),
        triggers: expect.arrayContaining(
          profile.knownTriggers.map((trigger) =>
            expect.objectContaining({
              triggerKey: trigger.triggerKey,
              severity: trigger.severity
            })
          )
        )
      })
    );

    const fetchedProfile = await requestJson<typeof savedProfile.body.data>(
      "GET",
      "/me/skin-profile",
      undefined,
      accessToken
    );
    expect(fetchedProfile.status).toBe(200);
    expect(fetchedProfile.body).toEqual({
      data: expect.objectContaining({
        profile: expect.objectContaining({
          skinType: profile.skinType,
          goals: expect.arrayContaining(
            profile.goals.map((goal) =>
              expect.objectContaining({
                goalKey: goal.goalKey,
                priority: goal.priority
              })
            )
          )
        })
      }),
      meta: { requestId: expect.any(String) },
      error: null
    });
  });
});

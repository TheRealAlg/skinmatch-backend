import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConsentStatus, ConsentType } from "@prisma/client";
import { PrismaService } from "../../common/database/prisma.service";
import { UpsertConsentDto } from "./dto/upsert-consent.dto";

@Injectable()
export class ConsentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLatestConsents(userId: string) {
    const consents = await this.prisma.userConsent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { market: true }
    });

    const latestByType = new Map<ConsentType, (typeof consents)[number]>();
    for (const consent of consents) {
      if (!latestByType.has(consent.consentType)) {
        latestByType.set(consent.consentType, consent);
      }
    }

    return {
      consents: Array.from(latestByType.values()).map((consent) => ({
        consentType: consent.consentType,
        consentVersion: consent.consentVersion,
        status: consent.status,
        locale: consent.locale,
        marketCode: consent.market.marketCode,
        acceptedAt: consent.acceptedAt,
        revokedAt: consent.revokedAt
      }))
    };
  }

  async recordConsent(userId: string, dto: UpsertConsentDto) {
    const market = await this.prisma.market.findUnique({
      where: { marketCode: dto.marketCode }
    });

    if (!market) {
      throw new NotFoundException(`Market ${dto.marketCode} was not found`);
    }

    const now = new Date();
    const consent = await this.prisma.userConsent.create({
      data: {
        userId,
        marketId: market.id,
        consentType: dto.consentType,
        consentVersion: dto.consentVersion,
        status: dto.status,
        locale: dto.locale,
        acceptedAt: dto.status === ConsentStatus.accepted ? now : null,
        revokedAt: dto.status === ConsentStatus.revoked ? now : null
      },
      include: { market: true }
    });

    return {
      consentType: consent.consentType,
      consentVersion: consent.consentVersion,
      status: consent.status,
      locale: consent.locale,
      marketCode: consent.market.marketCode,
      acceptedAt: consent.acceptedAt,
      revokedAt: consent.revokedAt
    };
  }

  async assertAcceptedConsent(userId: string, consentType: ConsentType) {
    const latest = await this.prisma.userConsent.findFirst({
      where: { userId, consentType },
      orderBy: { createdAt: "desc" }
    });

    if (!latest || latest.status !== ConsentStatus.accepted) {
      throw new BadRequestException({
        error: "CONSENT_REQUIRED",
        message: `${consentType} consent is required`,
        details: [{ consentType }]
      });
    }
  }

  requestAccountDeletion(userId: string) {
    return {
      status: "received",
      userId,
      message: "Account deletion/anonymization workflow is recorded as a Sprint 1 skeleton."
    };
  }
}

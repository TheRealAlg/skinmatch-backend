import { Injectable } from "@nestjs/common";
import { ConsentType } from "@prisma/client";
import { PrismaService } from "../../common/database/prisma.service";
import { ConsentsService } from "../consents/consents.service";
import { UpdateSkinProfileDto } from "./dto/update-skin-profile.dto";

@Injectable()
export class SkinProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly consentsService: ConsentsService
  ) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.userSkinProfile.findUnique({
      where: { userId },
      include: {
        goals: { orderBy: { priority: "asc" } },
        triggers: true
      }
    });

    return { profile };
  }

  async updateProfile(userId: string, dto: UpdateSkinProfileDto) {
    await this.consentsService.assertAcceptedConsent(
      userId,
      ConsentType.skin_profile_processing
    );

    const profile = await this.prisma.$transaction(async (tx) => {
      const savedProfile = await tx.userSkinProfile.upsert({
        where: { userId },
        update: {
          skinType: dto.skinType,
          sensitivityLevel: dto.sensitivityLevel,
          oilinessPattern: dto.oilinessPattern,
          drynessPattern: dto.drynessPattern,
          poresLevel: dto.poresLevel,
          blackheadTendency: dto.blackheadTendency,
          cloggedPoreTendency: dto.cloggedPoreTendency,
          acneTendency: dto.acneTendency,
          rednessTendency: dto.rednessTendency,
          hyperpigmentationLevel: dto.hyperpigmentationLevel,
          textureConcernLevel: dto.textureConcernLevel,
          dehydrationLevel: dto.dehydrationLevel,
          barrierDamageLevel: dto.barrierDamageLevel
        },
        create: {
          userId,
          skinType: dto.skinType,
          sensitivityLevel: dto.sensitivityLevel,
          oilinessPattern: dto.oilinessPattern,
          drynessPattern: dto.drynessPattern,
          poresLevel: dto.poresLevel,
          blackheadTendency: dto.blackheadTendency,
          cloggedPoreTendency: dto.cloggedPoreTendency,
          acneTendency: dto.acneTendency,
          rednessTendency: dto.rednessTendency,
          hyperpigmentationLevel: dto.hyperpigmentationLevel,
          textureConcernLevel: dto.textureConcernLevel,
          dehydrationLevel: dto.dehydrationLevel,
          barrierDamageLevel: dto.barrierDamageLevel
        }
      });

      await tx.userSkinGoal.deleteMany({ where: { profileId: savedProfile.id } });
      await tx.userKnownTrigger.deleteMany({ where: { profileId: savedProfile.id } });

      if (dto.goals.length > 0) {
        await tx.userSkinGoal.createMany({
          data: dto.goals.map((goal) => ({
            profileId: savedProfile.id,
            goalKey: goal.goalKey,
            priority: goal.priority
          }))
        });
      }

      if (dto.knownTriggers.length > 0) {
        await tx.userKnownTrigger.createMany({
          data: dto.knownTriggers.map((trigger) => ({
            profileId: savedProfile.id,
            triggerKey: trigger.triggerKey,
            severity: trigger.severity,
            source: "user_reported"
          }))
        });
      }

      return tx.userSkinProfile.findUniqueOrThrow({
        where: { userId },
        include: {
          goals: { orderBy: { priority: "asc" } },
          triggers: true
        }
      });
    });

    return { profile };
  }
}

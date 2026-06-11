import {
  AcneTendency,
  LevelWithUnknown,
  PatternWithUnknown,
  SkinGoalKey,
  SkinType,
  TendencyWithUnknown,
  TriggerKey
} from "@prisma/client";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
  ValidateNested
} from "class-validator";

export class SkinGoalDto {
  @IsEnum(SkinGoalKey)
  goalKey!: SkinGoalKey;

  @IsInt()
  @Min(0)
  @Max(10)
  priority!: number;
}

export class KnownTriggerDto {
  @IsEnum(TriggerKey)
  triggerKey!: TriggerKey;

  @IsEnum(LevelWithUnknown)
  severity!: LevelWithUnknown;
}

export class UpdateSkinProfileDto {
  @IsEnum(SkinType)
  skinType!: SkinType;

  @IsEnum(LevelWithUnknown)
  sensitivityLevel!: LevelWithUnknown;

  @IsEnum(PatternWithUnknown)
  oilinessPattern!: PatternWithUnknown;

  @IsEnum(PatternWithUnknown)
  drynessPattern!: PatternWithUnknown;

  @IsEnum(LevelWithUnknown)
  poresLevel!: LevelWithUnknown;

  @IsEnum(TendencyWithUnknown)
  blackheadTendency!: TendencyWithUnknown;

  @IsEnum(TendencyWithUnknown)
  cloggedPoreTendency!: TendencyWithUnknown;

  @IsEnum(AcneTendency)
  acneTendency!: AcneTendency;

  @IsEnum(LevelWithUnknown)
  rednessTendency!: LevelWithUnknown;

  @IsEnum(LevelWithUnknown)
  hyperpigmentationLevel!: LevelWithUnknown;

  @IsEnum(LevelWithUnknown)
  textureConcernLevel!: LevelWithUnknown;

  @IsEnum(LevelWithUnknown)
  dehydrationLevel!: LevelWithUnknown;

  @IsEnum(LevelWithUnknown)
  barrierDamageLevel!: LevelWithUnknown;

  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => SkinGoalDto)
  goals!: SkinGoalDto[];

  @IsOptional()
  @IsArray()
  @ArrayUnique((trigger: KnownTriggerDto) => trigger.triggerKey)
  @ValidateNested({ each: true })
  @Type(() => KnownTriggerDto)
  knownTriggers: KnownTriggerDto[] = [];
}

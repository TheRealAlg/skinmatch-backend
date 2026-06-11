import { ConsentStatus, ConsentType } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";

export class UpsertConsentDto {
  @IsEnum(ConsentType)
  consentType!: ConsentType;

  @IsString()
  @IsNotEmpty()
  consentVersion!: string;

  @IsEnum(ConsentStatus)
  status!: ConsentStatus;

  @IsString()
  @IsNotEmpty()
  locale!: string;

  @IsString()
  @IsNotEmpty()
  marketCode!: string;
}

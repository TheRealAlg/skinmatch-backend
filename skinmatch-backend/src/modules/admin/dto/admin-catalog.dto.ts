import {
  CatalogCandidateStatus,
  DataConfidence,
  VerificationStatus
} from "@prisma/client";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  ValidateNested
} from "class-validator";

export class ReviewedIngredientMappingDto {
  @IsString()
  rawText!: string;

  @IsString()
  inciName!: string;

  @IsOptional()
  @IsString()
  displayNameTr?: string;

  @IsOptional()
  @IsString()
  descriptionTr?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  aliases?: string[] = [];

  @IsOptional()
  @IsEnum(DataConfidence)
  mappingConfidence?: DataConfidence;
}

export class CandidateProductDto {
  @IsBoolean()
  approvedForImport!: boolean;

  @IsOptional()
  @IsString()
  marketCode?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  currencyCode?: string;

  @IsString()
  brandName!: string;

  @IsOptional()
  @IsString()
  globalCanonicalName?: string;

  @IsString()
  localProductName!: string;

  @IsString()
  category!: string;

  @IsString()
  barcodeGtin!: string;

  @IsString()
  rawIngredientText!: string;

  @IsString()
  sourceName!: string;

  @IsUrl({ require_tld: false })
  sourceUrl!: string;

  @IsEnum(VerificationStatus)
  verificationStatus!: VerificationStatus;

  @IsEnum(DataConfidence)
  dataConfidence!: DataConfidence;

  @IsOptional()
  @IsString()
  reviewer?: string;

  @IsOptional()
  @IsString()
  reviewNotes?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  imageUrl?: string;

  @IsOptional()
  @IsString()
  imageAltText?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  imageSourceUrl?: string;

  @IsOptional()
  @IsString()
  imageUsageRightsNote?: string;

  @IsOptional()
  @IsString()
  verificationMethod?: string;

  @IsOptional()
  @IsString()
  verificationCheckedAt?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => ReviewedIngredientMappingDto)
  ingredientMappings?: ReviewedIngredientMappingDto[] = [];
}

export class IngestReviewedProductsDto {
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CandidateProductDto)
  products!: CandidateProductDto[];
}

export class FetchOpenBeautyFactsCandidatesDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  queries?: string[] = [];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 25;
}

export class ListCandidatesQueryDto {
  @IsOptional()
  @IsEnum(CatalogCandidateStatus)
  status?: CatalogCandidateStatus;

  @IsOptional()
  @IsString()
  issueKey?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 25;
}

export class ReviewCandidateDto {
  @IsOptional()
  @IsBoolean()
  approvedForImport?: boolean;

  @IsOptional()
  @IsString()
  brandName?: string;

  @IsOptional()
  @IsString()
  localProductName?: string;

  @IsOptional()
  @IsString()
  globalCanonicalName?: string;

  @IsOptional()
  @IsString()
  barcodeGtin?: string;

  @IsOptional()
  @IsString()
  rawIngredientText?: string;

  @IsOptional()
  @IsString()
  sourceName?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  sourceUrl?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  imageSourceUrl?: string;

  @IsOptional()
  @IsString()
  imageUsageRightsNote?: string;

  @IsOptional()
  @IsString()
  verificationMethod?: string;

  @IsOptional()
  @IsString()
  verificationCheckedAt?: string;

  @IsOptional()
  @IsString()
  imageAltText?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => ReviewedIngredientMappingDto)
  ingredientMappings?: ReviewedIngredientMappingDto[] = [];

  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;

  @IsOptional()
  @IsEnum(DataConfidence)
  dataConfidence?: DataConfidence;

  @IsOptional()
  @IsEnum(CatalogCandidateStatus)
  status?: CatalogCandidateStatus;

  @IsOptional()
  @IsString()
  reviewer?: string;

  @IsOptional()
  @IsString()
  reviewNotes?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class UpsertIngredientDto {
  @IsString()
  inciName!: string;

  @IsOptional()
  @IsString()
  displayNameTr?: string;

  @IsOptional()
  @IsString()
  descriptionTr?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  synonyms?: string[] = [];
}

export class UpsertCategoryDto {
  @IsString()
  key!: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sortOrder?: number = 0;

  @IsString()
  displayNameTr!: string;

  @IsOptional()
  @IsString()
  descriptionTr?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  aliases?: string[] = [];
}

export class UpsertIngredientLocalizationDto {
  @IsString()
  displayName!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  synonyms?: string[] = [];
}

export class ListIngredientsQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  missingTr?: boolean = false;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 25;
}

import { IsOptional, IsString } from "class-validator";

export class BarcodeLookupQueryDto {
  @IsOptional()
  @IsString()
  marketCode?: string = "TR";
}

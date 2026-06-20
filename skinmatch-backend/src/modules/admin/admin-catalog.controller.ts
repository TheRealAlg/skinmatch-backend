import { Body, Controller, Get, Param, Patch, Post, Query, Res, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { AdminKeyGuard } from "./admin-key.guard";
import { AdminCatalogService } from "./admin-catalog.service";
import {
  IngestReviewedProductsDto,
  ListCandidatesQueryDto,
  ListIngredientsQueryDto,
  ReviewCandidateDto,
  UpsertCategoryDto,
  UpsertIngredientDto,
  UpsertIngredientLocalizationDto
} from "./dto/admin-catalog.dto";

@UseGuards(AdminKeyGuard)
@Controller("admin/catalog")
export class AdminCatalogController {
  constructor(private readonly adminCatalogService: AdminCatalogService) {}

  @Get("panel")
  async panel(@Res() response: Response) {
    response.type("html").send(await this.adminCatalogService.getPanelHtml());
  }

  @Post("candidates/from-reviewed-products")
  ingestReviewedProducts(@Body() dto: IngestReviewedProductsDto) {
    return this.adminCatalogService.ingestReviewedProducts(dto.products);
  }

  @Get("candidates")
  listCandidates(@Query() query: ListCandidatesQueryDto) {
    return this.adminCatalogService.listCandidates(query);
  }

  @Get("issues/summary")
  issueSummary() {
    return this.adminCatalogService.issueSummary();
  }

  @Patch("candidates/:id/review")
  reviewCandidate(@Param("id") id: string, @Body() dto: ReviewCandidateDto) {
    return this.adminCatalogService.reviewCandidate(id, dto);
  }

  @Post("candidates/:id/import")
  importCandidate(@Param("id") id: string) {
    return this.adminCatalogService.importCandidate(id);
  }

  @Get("categories")
  listCategories() {
    return this.adminCatalogService.listCategories();
  }

  @Post("categories")
  upsertCategory(@Body() dto: UpsertCategoryDto) {
    return this.adminCatalogService.upsertCategory(dto);
  }

  @Get("ingredients")
  listIngredients(@Query() query: ListIngredientsQueryDto) {
    return this.adminCatalogService.listIngredients(query);
  }

  @Post("ingredients")
  upsertIngredient(@Body() dto: UpsertIngredientDto) {
    return this.adminCatalogService.upsertIngredient(dto);
  }

  @Patch("ingredients/:id/localizations/tr-TR")
  upsertIngredientLocalization(
    @Param("id") id: string,
    @Body() dto: UpsertIngredientLocalizationDto
  ) {
    return this.adminCatalogService.upsertIngredientLocalization(id, dto);
  }
}

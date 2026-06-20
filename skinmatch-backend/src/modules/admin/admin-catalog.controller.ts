import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { AdminKeyGuard } from "./admin-key.guard";
import { AdminCatalogService } from "./admin-catalog.service";
import {
  FetchOpenBeautyFactsCandidatesDto,
  IngestReviewedProductsDto,
  ListCandidatesQueryDto,
  ListIngredientsQueryDto,
  ReviewCandidateDto,
  UpsertCategoryDto,
  UpsertIngredientDto,
  UpsertIngredientLocalizationDto
} from "./dto/admin-catalog.dto";

@Controller("admin/catalog")
export class AdminCatalogController {
  constructor(private readonly adminCatalogService: AdminCatalogService) {}

  @UseGuards(AdminKeyGuard)
  @Post("candidates/from-reviewed-products")
  ingestReviewedProducts(@Body() dto: IngestReviewedProductsDto) {
    return this.adminCatalogService.ingestReviewedProducts(dto.products);
  }

  @UseGuards(AdminKeyGuard)
  @Post("candidates/fetch-open-beauty-facts")
  fetchOpenBeautyFactsCandidates(@Body() dto: FetchOpenBeautyFactsCandidatesDto) {
    return this.adminCatalogService.fetchOpenBeautyFactsCandidates(dto);
  }

  @UseGuards(AdminKeyGuard)
  @Get("candidates")
  listCandidates(@Query() query: ListCandidatesQueryDto) {
    return this.adminCatalogService.listCandidates(query);
  }

  @UseGuards(AdminKeyGuard)
  @Get("candidates/:id/review-workspace")
  getCandidateReviewWorkspace(@Param("id") id: string) {
    return this.adminCatalogService.getCandidateReviewWorkspace(id);
  }

  @UseGuards(AdminKeyGuard)
  @Get("issues/summary")
  issueSummary() {
    return this.adminCatalogService.issueSummary();
  }

  @UseGuards(AdminKeyGuard)
  @Patch("candidates/:id/review")
  reviewCandidate(@Param("id") id: string, @Body() dto: ReviewCandidateDto) {
    return this.adminCatalogService.reviewCandidate(id, dto);
  }

  @UseGuards(AdminKeyGuard)
  @Post("candidates/import-approved")
  importApprovedCandidates() {
    return this.adminCatalogService.importApprovedCandidates();
  }

  @UseGuards(AdminKeyGuard)
  @Post("candidates/:id/import")
  importCandidate(@Param("id") id: string) {
    return this.adminCatalogService.importCandidate(id);
  }

  @UseGuards(AdminKeyGuard)
  @Get("categories")
  listCategories() {
    return this.adminCatalogService.listCategories();
  }

  @UseGuards(AdminKeyGuard)
  @Post("categories")
  upsertCategory(@Body() dto: UpsertCategoryDto) {
    return this.adminCatalogService.upsertCategory(dto);
  }

  @UseGuards(AdminKeyGuard)
  @Get("ingredients")
  listIngredients(@Query() query: ListIngredientsQueryDto) {
    return this.adminCatalogService.listIngredients(query);
  }

  @UseGuards(AdminKeyGuard)
  @Post("ingredients")
  upsertIngredient(@Body() dto: UpsertIngredientDto) {
    return this.adminCatalogService.upsertIngredient(dto);
  }

  @UseGuards(AdminKeyGuard)
  @Patch("ingredients/:id/localizations/tr-TR")
  upsertIngredientLocalization(
    @Param("id") id: string,
    @Body() dto: UpsertIngredientLocalizationDto
  ) {
    return this.adminCatalogService.upsertIngredientLocalization(id, dto);
  }
}

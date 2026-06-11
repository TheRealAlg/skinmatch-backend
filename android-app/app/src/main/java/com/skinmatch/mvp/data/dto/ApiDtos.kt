package com.skinmatch.mvp.data.dto

import com.google.gson.JsonElement

data class EnvelopeDto<T>(
    val data: T? = null,
    val meta: MetaDto? = null,
    val error: ErrorDto? = null,
)

data class MetaDto(
    val requestId: String? = null,
)

data class ErrorDto(
    val code: String? = null,
    val message: String? = null,
    val details: JsonElement? = null,
)

data class ProductSearchEnvelopeDto(
    val products: List<ProductSummaryDto> = emptyList(),
    val pagination: PaginationDto? = null,
    val search: SearchMetadataDto? = null,
)

data class ProductDetailEnvelopeDto(
    val product: ProductDetailDto? = null,
)

data class BarcodeLookupEnvelopeDto(
    val lookupStatus: String? = null,
    val gtin: String? = null,
    val marketCode: String? = null,
    val product: ProductSummaryDto? = null,
    val candidate: JsonElement? = null,
    val candidateStrategy: String? = null,
)

data class PaginationDto(
    val page: Int? = null,
    val limit: Int? = null,
    val total: Int? = null,
    val totalPages: Int? = null,
)

data class SearchMetadataDto(
    val marketCode: String? = null,
    val q: String? = null,
    val category: String? = null,
    val brand: String? = null,
    val verificationStatus: String? = null,
    val dataConfidence: String? = null,
    val engine: String? = null,
)

data class ProductSummaryDto(
    val id: String? = null,
    val category: String? = null,
    val localProductName: String? = null,
    val canonicalName: String? = null,
    val barcodeGtin: String? = null,
    val brand: BrandDto? = null,
    val market: MarketDto? = null,
    val verification: VerificationDto? = null,
    val dataConfidence: String? = null,
    val image: ProductImageDto? = null,
)

data class ProductDetailDto(
    val id: String? = null,
    val category: String? = null,
    val localProductName: String? = null,
    val canonicalName: String? = null,
    val barcodeGtin: String? = null,
    val brand: BrandDto? = null,
    val market: MarketDto? = null,
    val verification: VerificationDto? = null,
    val dataConfidence: String? = null,
    val image: ProductImageDto? = null,
    val globalProduct: GlobalProductDto? = null,
    val marketProduct: MarketProductDto? = null,
    val rawIngredientText: String? = null,
    val images: List<ProductImageDto> = emptyList(),
    val regulatoryChecks: List<RegulatoryCheckDto> = emptyList(),
    val ingredients: List<IngredientMappingDto> = emptyList(),
    val recommendationExplanation: RecommendationExplanationDto? = null,
)

data class BrandDto(
    val id: String? = null,
    val name: String? = null,
)

data class MarketDto(
    val code: String? = null,
    val locale: String? = null,
    val currencyCode: String? = null,
)

data class VerificationDto(
    val status: String? = null,
    val method: String? = null,
    val source: String? = null,
    val checkedAt: String? = null,
)

data class ProductImageDto(
    val id: String? = null,
    val url: String? = null,
    val altText: String? = null,
    val source: String? = null,
    val sortOrder: Int? = null,
    val isPrimary: Boolean? = null,
)

data class GlobalProductDto(
    val id: String? = null,
    val canonicalName: String? = null,
    val normalizedName: String? = null,
)

data class MarketProductDto(
    val id: String? = null,
    val marketCode: String? = null,
    val localProductName: String? = null,
    val normalizedLocalProductName: String? = null,
    val category: String? = null,
    val barcodeGtin: String? = null,
)

data class RegulatoryCheckDto(
    val id: String? = null,
    val status: String? = null,
    val method: String? = null,
    val source: String? = null,
    val sourceUrl: String? = null,
    val checkedAt: String? = null,
    val checkedBy: String? = null,
    val notes: String? = null,
)

data class IngredientMappingDto(
    val id: String? = null,
    val inciName: String? = null,
    val normalizedName: String? = null,
    val displayName: String? = null,
    val displayLocale: String? = null,
    val position: Int? = null,
    val rawText: String? = null,
    val mappingConfidence: String? = null,
    val functions: List<IngredientFunctionDto> = emptyList(),
    val flags: List<IngredientFlagDto> = emptyList(),
    val synonyms: List<IngredientSynonymDto> = emptyList(),
)

data class IngredientFunctionDto(
    val functionKey: String? = null,
    val labelTr: String? = null,
    val noteTr: String? = null,
)

data class IngredientFlagDto(
    val flagKey: String? = null,
    val labelTr: String? = null,
    val noteTr: String? = null,
    val confidence: String? = null,
)

data class IngredientSynonymDto(
    val locale: String? = null,
    val synonym: String? = null,
    val normalizedSynonym: String? = null,
)

data class RecommendationExplanationDto(
    val status: String? = null,
    val confidence: String? = null,
    val notes: List<String> = emptyList(),
    val dataGaps: List<String> = emptyList(),
)

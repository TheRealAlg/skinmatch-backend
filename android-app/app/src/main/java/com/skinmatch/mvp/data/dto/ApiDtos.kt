package com.skinmatch.mvp.data.dto

data class EnvelopeDto<T>(
    val data: T?,
    val meta: MetaDto?,
    val error: ErrorDto?,
)

data class MetaDto(
    val requestId: String?,
)

data class ErrorDto(
    val code: String,
    val message: String,
    val details: Map<String, String>? = null,
)

data class ProductSearchDto(
    val id: String,
    val brand: String,
    val productGlobalName: String,
    val productMarketName: String,
    val category: String,
    val market: String,
    val verificationStatus: String,
    val dataConfidence: String,
)

data class ProductDetailDto(
    val id: String,
    val productGlobalName: String,
    val productMarketName: String,
    val brand: String,
    val category: String,
    val rawIngredientText: String,
    val verificationStatus: String,
    val dataConfidence: String,
)

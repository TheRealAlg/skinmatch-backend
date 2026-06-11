package com.skinmatch.mvp.data.repository

import com.skinmatch.mvp.data.api.SkinMatchApi
import com.skinmatch.mvp.data.dto.BarcodeLookupEnvelopeDto
import com.skinmatch.mvp.data.dto.EnvelopeDto
import com.skinmatch.mvp.data.dto.IngredientFlagDto
import com.skinmatch.mvp.data.dto.IngredientFunctionDto
import com.skinmatch.mvp.data.dto.IngredientMappingDto
import com.skinmatch.mvp.data.dto.ProductDetailDto
import com.skinmatch.mvp.data.dto.ProductSummaryDto
import com.skinmatch.mvp.data.dto.RecommendationExplanationDto
import com.skinmatch.mvp.domain.models.DataConfidence
import com.skinmatch.mvp.domain.models.IngredientFlag
import com.skinmatch.mvp.domain.models.IngredientFunction
import com.skinmatch.mvp.domain.models.IngredientItem
import com.skinmatch.mvp.domain.models.ProductDetail
import com.skinmatch.mvp.domain.models.ProductSearchResult
import com.skinmatch.mvp.domain.models.RecommendationExplanation
import com.skinmatch.mvp.domain.models.VerificationStatus

interface ProductRepository {
    suspend fun search(query: String): List<ProductSearchResult>
    suspend fun detail(productId: String): ProductDetail
    suspend fun barcodeLookup(gtin: String): BarcodeLookupResult
}

data class BarcodeLookupResult(
    val lookupStatus: String,
    val gtin: String,
    val marketCode: String,
    val product: ProductSearchResult?,
    val candidateStrategy: String,
)

class CatalogApiException(message: String) : RuntimeException(message)

class RetrofitProductRepository(
    private val api: SkinMatchApi,
) : ProductRepository {
    override suspend fun search(query: String): List<ProductSearchResult> {
        val trimmedQuery = query.trim()
        if (trimmedQuery.isBlank()) return emptyList()

        val data = api.searchProducts(
            query = trimmedQuery,
            marketCode = "TR",
            page = 1,
            limit = 20,
        ).requireData()

        return data.products.map { product -> product.toDomain() }
    }

    override suspend fun detail(productId: String): ProductDetail {
        val data = api.productDetail(productId).requireData()
        val product = data.product ?: throw CatalogApiException("Product detail response did not include a product.")
        return product.toDomain()
    }

    override suspend fun barcodeLookup(gtin: String): BarcodeLookupResult {
        val data = api.barcodeLookup(gtin = gtin, marketCode = "TR").requireData()
        return data.toDomain()
    }
}

private fun <T> EnvelopeDto<T>.requireData(): T {
    data?.let { return it }
    val apiMessage = error?.message?.takeIf { it.isNotBlank() }
    val apiCode = error?.code?.takeIf { it.isNotBlank() }
    throw CatalogApiException(apiMessage ?: apiCode ?: "Catalog response did not include data.")
}

private fun BarcodeLookupEnvelopeDto.toDomain() = BarcodeLookupResult(
    lookupStatus = lookupStatus.orEmpty(),
    gtin = gtin.orEmpty(),
    marketCode = marketCode.orEmpty(),
    product = product?.toDomain(),
    candidateStrategy = candidateStrategy.orEmpty(),
)

private fun ProductSummaryDto.toDomain(): ProductSearchResult {
    val confidence = dataConfidence.toDataConfidence()
    val verificationStatus = verification?.status.toVerificationStatus()

    return ProductSearchResult(
        id = id.orEmpty(),
        brand = brand?.name.orUnknown("Marka bilinmiyor"),
        name = localProductName.orUnknown(canonicalName.orEmpty()),
        canonicalName = canonicalName.orEmpty(),
        category = category.orUnknown("Kategori bilinmiyor"),
        barcodeGtin = barcodeGtin.orEmpty(),
        marketCode = market?.code.orUnknown("TR"),
        verificationStatus = verificationStatus,
        verificationMethod = verification?.method.orEmpty(),
        verificationSource = verification?.source.orEmpty(),
        verificationCheckedAt = verification?.checkedAt.orEmpty(),
        dataConfidence = confidence,
        imageUrl = image?.url,
        note = buildCatalogNote(verificationStatus, confidence),
    )
}

private fun ProductDetailDto.toDomain(): ProductDetail {
    val confidence = dataConfidence.toDataConfidence()
    val verificationStatus = verification?.status.toVerificationStatus()
    val explanation = recommendationExplanation.toDomain(confidence)

    return ProductDetail(
        id = id.orEmpty(),
        globalProductName = globalProduct?.canonicalName
            .orUnknown(canonicalName.orUnknown("Ürün adı bilinmiyor")),
        marketProductName = marketProduct?.localProductName
            .orUnknown(localProductName.orUnknown(canonicalName.orUnknown("Ürün adı bilinmiyor"))),
        brand = brand?.name.orUnknown("Marka bilinmiyor"),
        category = marketProduct?.category.orUnknown(category.orUnknown("Kategori bilinmiyor")),
        barcodeGtin = marketProduct?.barcodeGtin.orUnknown(barcodeGtin.orEmpty()),
        marketCode = marketProduct?.marketCode.orUnknown(market?.code.orUnknown("TR")),
        imageUrl = images.firstOrNull { it.isPrimary == true }?.url ?: image?.url ?: images.firstOrNull()?.url,
        verificationStatus = verificationStatus,
        verificationMethod = verification?.method.orEmpty(),
        verificationSource = verification?.source.orEmpty(),
        verificationCheckedAt = verification?.checkedAt.orEmpty(),
        dataConfidence = confidence,
        rawIngredientText = rawIngredientText.orUnknown("Ham içerik metni bulunamadı."),
        normalizedIngredients = ingredients.map { ingredient -> ingredient.toDomain() },
        recommendationExplanation = explanation,
        confidenceNote = buildCatalogNote(verificationStatus, confidence, explanation),
    )
}

private fun IngredientMappingDto.toDomain() = IngredientItem(
    inciName = inciName.orUnknown(rawText.orUnknown("İçerik adı bilinmiyor")),
    displayName = displayName.orUnknown(inciName.orUnknown("İçerik adı bilinmiyor")),
    rawText = rawText.orEmpty(),
    mappingConfidence = mappingConfidence.toDataConfidence(),
    functions = functions.map { function -> function.toDomain() },
    flags = flags.map { flag -> flag.toDomain() },
    synonyms = synonyms.mapNotNull { synonym -> synonym.synonym?.takeIf { it.isNotBlank() } },
)

private fun IngredientFunctionDto.toDomain() = IngredientFunction(
    key = functionKey.orEmpty(),
    label = labelTr.orUnknown(functionKey.orUnknown("Fonksiyon bilinmiyor")),
    note = noteTr,
)

private fun IngredientFlagDto.toDomain() = IngredientFlag(
    key = flagKey.orEmpty(),
    label = labelTr.orUnknown(flagKey.orUnknown("Bayrak bilinmiyor")),
    note = noteTr,
    confidence = confidence.toDataConfidence(),
)

private fun RecommendationExplanationDto?.toDomain(
    fallbackConfidence: DataConfidence,
): RecommendationExplanation {
    return RecommendationExplanation(
        status = this?.status.orUnknown("not_scored"),
        confidence = this?.confidence.toDataConfidence(fallbackConfidence),
        notes = this?.notes.orEmpty(),
        dataGaps = this?.dataGaps.orEmpty(),
    )
}

private fun String?.toDataConfidence(
    fallback: DataConfidence = DataConfidence.UNKNOWN,
): DataConfidence = when (this?.lowercase()) {
    "high" -> DataConfidence.HIGH
    "medium" -> DataConfidence.MEDIUM
    "low" -> DataConfidence.LOW
    null, "" -> fallback
    else -> DataConfidence.UNKNOWN
}

private fun String?.toVerificationStatus(): VerificationStatus = when (this?.lowercase()) {
    "unverified" -> VerificationStatus.UNVERIFIED
    "user_submitted" -> VerificationStatus.USER_SUBMITTED
    "retailer_sourced" -> VerificationStatus.RETAILER_SOURCED
    "label_reviewed" -> VerificationStatus.LABEL_REVIEWED
    "uts_checked" -> VerificationStatus.UTS_CHECKED
    else -> VerificationStatus.UNKNOWN
}

private fun buildCatalogNote(
    verificationStatus: VerificationStatus,
    dataConfidence: DataConfidence,
    explanation: RecommendationExplanation? = null,
): String {
    val limitedData = dataConfidence == DataConfidence.LOW ||
        dataConfidence == DataConfidence.UNKNOWN ||
        explanation?.dataGaps?.isNotEmpty() == true
    val status = explanation?.status ?: "not_scored"

    return when {
        status == "not_scored" && limitedData ->
            "not_scored: Katalog verisi sınırlı; güçlü uygunluk yorumu yapılmaz."
        status == "not_scored" ->
            "not_scored: Bu katalog yanıtı yalnızca içerik ve doğrulama bağlamı sağlar."
        verificationStatus == VerificationStatus.UNKNOWN ->
            "Doğrulama durumu bilinmiyor; veriyi sınırlı kabul edin."
        else ->
            "Katalog verisi backend doğrulama ve güven bilgileriyle gösteriliyor."
    }
}

private fun String?.orUnknown(fallback: String): String = takeIf { !it.isNullOrBlank() } ?: fallback

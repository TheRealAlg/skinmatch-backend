package com.skinmatch.mvp.domain.models

enum class DataConfidence(val label: String) {
    HIGH("Yüksek"),
    MEDIUM("Orta"),
    LOW("Düşük"),
    UNKNOWN("Sınırlı/bilinmiyor"),
}

enum class VerificationStatus(val label: String) {
    UNVERIFIED("Doğrulanmadı"),
    USER_SUBMITTED("Kullanıcı bildirimi"),
    RETAILER_SOURCED("Perakendeci kaynaklı"),
    LABEL_REVIEWED("Etiket incelendi"),
    UTS_CHECKED("ÜTS kontrol edildi"),
    UNKNOWN("Doğrulama bilinmiyor"),
}

data class IngredientFunction(
    val key: String,
    val label: String,
    val note: String?,
)

data class IngredientFlag(
    val key: String,
    val label: String,
    val note: String?,
    val confidence: DataConfidence,
)

data class IngredientItem(
    val inciName: String,
    val displayName: String,
    val rawText: String,
    val mappingConfidence: DataConfidence,
    val functions: List<IngredientFunction>,
    val flags: List<IngredientFlag>,
    val synonyms: List<String>,
)

data class RecommendationExplanation(
    val status: String,
    val confidence: DataConfidence,
    val notes: List<String>,
    val dataGaps: List<String>,
)

data class ProductSearchResult(
    val id: String,
    val brand: String,
    val name: String,
    val canonicalName: String,
    val category: String,
    val barcodeGtin: String,
    val marketCode: String,
    val verificationStatus: VerificationStatus,
    val verificationMethod: String,
    val verificationSource: String,
    val verificationCheckedAt: String,
    val dataConfidence: DataConfidence,
    val imageUrl: String?,
    val note: String,
)

data class ProductDetail(
    val id: String,
    val globalProductName: String,
    val marketProductName: String,
    val brand: String,
    val category: String,
    val barcodeGtin: String,
    val marketCode: String,
    val imageUrl: String?,
    val verificationStatus: VerificationStatus,
    val verificationMethod: String,
    val verificationSource: String,
    val verificationCheckedAt: String,
    val dataConfidence: DataConfidence,
    val rawIngredientText: String,
    val normalizedIngredients: List<IngredientItem>,
    val recommendationExplanation: RecommendationExplanation,
    val confidenceNote: String,
) {
    val searchResult = ProductSearchResult(
        id = id,
        brand = brand,
        name = marketProductName,
        canonicalName = globalProductName,
        category = category,
        barcodeGtin = barcodeGtin,
        marketCode = marketCode,
        verificationStatus = verificationStatus,
        verificationMethod = verificationMethod,
        verificationSource = verificationSource,
        verificationCheckedAt = verificationCheckedAt,
        dataConfidence = dataConfidence,
        imageUrl = imageUrl,
        note = confidenceNote,
    )
}

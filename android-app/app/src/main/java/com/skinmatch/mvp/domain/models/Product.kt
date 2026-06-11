package com.skinmatch.mvp.domain.models

enum class DataConfidence(val label: String) {
    HIGH("Yüksek"),
    MEDIUM("Orta"),
    LOW("Düşük"),
}

enum class VerificationStatus(val label: String) {
    UTS_VERIFIED("ÜTS kaydı doğrulandı"),
    LABEL_REVIEW("İçerik listesi doğrulanıyor"),
    MARKET_UNVERIFIED("Türkiye ürün verisi sınırlı"),
}

data class IngredientItem(
    val inciName: String,
    val displayName: String,
    val function: String,
    val confidence: DataConfidence,
    val note: String,
)

data class ProductSearchResult(
    val id: String,
    val brand: String,
    val name: String,
    val category: String,
    val verificationStatus: VerificationStatus,
    val dataConfidence: DataConfidence,
    val note: String,
)

data class ProductDetail(
    val id: String,
    val globalProductName: String,
    val marketProductName: String,
    val brand: String,
    val category: String,
    val texture: String,
    val verificationStatus: VerificationStatus,
    val dataConfidence: DataConfidence,
    val localStatusNote: String,
    val skinFitPlaceholder: String,
    val whyThisMayFit: List<String>,
    val watchouts: List<String>,
    val compatibilityNotes: List<String>,
    val rawIngredientText: String,
    val normalizedIngredients: List<IngredientItem>,
    val confidenceNote: String,
) {
    val searchResult = ProductSearchResult(
        id = id,
        brand = brand,
        name = marketProductName,
        category = category,
        verificationStatus = verificationStatus,
        dataConfidence = dataConfidence,
        note = confidenceNote,
    )
}

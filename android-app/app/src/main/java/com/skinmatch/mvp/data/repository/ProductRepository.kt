package com.skinmatch.mvp.data.repository

import com.skinmatch.mvp.domain.models.DataConfidence
import com.skinmatch.mvp.domain.models.IngredientItem
import com.skinmatch.mvp.domain.models.ProductDetail
import com.skinmatch.mvp.domain.models.ProductSearchResult
import com.skinmatch.mvp.domain.models.VerificationStatus
import kotlinx.coroutines.delay
import java.util.Locale

interface ProductRepository {
    suspend fun search(query: String): List<ProductSearchResult>
    suspend fun detail(productId: String): ProductDetail
}

class MockProductRepository : ProductRepository {
    private val products = listOf(
        ProductDetail(
            id = "tr-lumina-pore-balance-serum",
            globalProductName = "Pore Balance Serum",
            marketProductName = "Pore Balance Serum",
            brand = "Lumina",
            category = "Serum",
            texture = "Hafif jel",
            verificationStatus = VerificationStatus.UTS_VERIFIED,
            dataConfidence = DataConfidence.MEDIUM,
            localStatusNote = "Türkiye pazar kaydı mock veriyle işaretlendi. ÜTS doğrulaması backend katalog servisine bağlanınca yeniden kontrol edilecek.",
            skinFitPlaceholder = "Cilt uyumu puanı bu MVP içinde hesaplanmaz. Profiliniz ve ürün verisi backend öneri servisine bağlandığında yorumlanacak.",
            whyThisMayFit = listOf(
                "Yağlanma ve gözenek görünümü hedefleyen kullanıcılar için güçlü bir aday olabilir.",
                "Niacinamide ve panthenol gibi destekleyici içerikler profil hedefleriyle ilişkili olabilir.",
                "Benzer kullanıcı sonucu verisi şu an sınırlı olduğu için ifade temkinli tutulur.",
            ),
            watchouts = listOf(
                "Parfüm içeriği tespit edilmedi; yine de hassas ciltlerde yama testi düşünülmelidir.",
                "Witch hazel bazı hassas ciltlerde batma hissiyle ilişkilendirilebilir.",
            ),
            compatibilityNotes = listOf(
                "Profilinizde yağlanma veya gözenek görünümü hedefi varsa içerik yönü uyumlu olabilir.",
                "Bilinen tetikleyicileriniz backend ürün geçmişiyle eşleşince daha net yorumlanacak.",
            ),
            rawIngredientText = "Aqua, Niacinamide, Glycerin, Panthenol, Zinc PCA, Hamamelis Virginiana Water, Sodium Hyaluronate, Phenoxyethanol, Ethylhexylglycerin.",
            normalizedIngredients = listOf(
                IngredientItem("Niacinamide", "Niasinamid", "Cilt tonu ve bariyer desteği", DataConfidence.HIGH, "Eşleştirme güveni yüksek."),
                IngredientItem("Glycerin", "Gliserin", "Nem tutucu", DataConfidence.HIGH, "Yaygın nemlendirici içerik."),
                IngredientItem("Panthenol", "Pantenol", "Yatıştırıcı destek", DataConfidence.MEDIUM, "Cilt bariyeri desteğiyle ilişkilendirilebilir."),
                IngredientItem("Zinc PCA", "Çinko PCA", "Yağ dengesi desteği", DataConfidence.MEDIUM, "Yağlanma hedefiyle ilişkili olabilir."),
                IngredientItem("Hamamelis Virginiana Water", "Witch hazel suyu", "Bitkisel destek", DataConfidence.LOW, "Hassas ciltlerde dikkat gerektirebilir."),
            ),
            confidenceNote = "Veri güveni orta. İçerik listesi mock kaynaktan geldiği için backend doğrulaması bekleniyor.",
        ),
        ProductDetail(
            id = "tr-dermovia-barrier-restore-cream",
            globalProductName = "Barrier Restore Cream",
            marketProductName = "Barrier Restore Cream",
            brand = "Dermovia",
            category = "Nemlendirici",
            texture = "Yoğun krem",
            verificationStatus = VerificationStatus.LABEL_REVIEW,
            dataConfidence = DataConfidence.HIGH,
            localStatusNote = "Etiket ve içerik metni mock katalogda güçlü. Türkiye ürün kaydı doğrulaması bekliyor.",
            skinFitPlaceholder = "Yerel öneri skoru yok. Bu alan backend ürün katalog ve profil eşleşmesiyle doldurulacak.",
            whyThisMayFit = listOf(
                "Nemsizlik ve bariyer desteği hedefleyen profiller için değerlendirilebilir.",
                "Ceramide NP, glycerin ve panthenol bariyer desteğiyle ilişkilendirilen içeriklerdir.",
            ),
            watchouts = listOf(
                "Yoğun krem yapısı tıkanmaya yatkın profillerde ağır hissedebilir.",
                "Akneye sık yatkınlık belirttiyseniz kullanım sıklığı dikkatle izlenmelidir.",
            ),
            compatibilityNotes = listOf(
                "Kuru veya nemsiz his belirten kullanıcılar için ürün yönü anlamlı olabilir.",
                "Tıkanma geçmişi ve ürün kullanma süresi olmadan daha güçlü çıkarım yapılmaz.",
            ),
            rawIngredientText = "Aqua, Glycerin, Caprylic/Capric Triglyceride, Panthenol, Ceramide NP, Cholesterol, Squalane, Carbomer, Phenoxyethanol.",
            normalizedIngredients = listOf(
                IngredientItem("Glycerin", "Gliserin", "Nem tutucu", DataConfidence.HIGH, "Eşleştirme güveni yüksek."),
                IngredientItem("Panthenol", "Pantenol", "Bariyer desteği", DataConfidence.HIGH, "Bariyer hedefiyle ilişkili olabilir."),
                IngredientItem("Ceramide NP", "Seramid NP", "Bariyer lipidi", DataConfidence.HIGH, "Normalize eşleşme güçlü."),
                IngredientItem("Squalane", "Skualan", "Yumuşatıcı", DataConfidence.MEDIUM, "Hafif yumuşatıcı olarak işaretlendi."),
            ),
            confidenceNote = "İçerik eşleştirme güveni yüksek; Türkiye pazar doğrulaması tamamlanmadı.",
        ),
        ProductDetail(
            id = "tr-anatolia-clear-skin-gel",
            globalProductName = "Clear Skin Gel",
            marketProductName = "Clear Skin Gel",
            brand = "Anatolia Lab",
            category = "Arındırıcı jel",
            texture = "Jel",
            verificationStatus = VerificationStatus.MARKET_UNVERIFIED,
            dataConfidence = DataConfidence.LOW,
            localStatusNote = "Türkiye pazar verisi sınırlı. Ürün adı ve içerik mock veriyle gösteriliyor.",
            skinFitPlaceholder = "Bu MVP yerel uyum puanı üretmez. Düşük güvenli veriler yalnızca keşif amaçlı gösterilir.",
            whyThisMayFit = listOf(
                "Yağlanma ve tıkanma hedefi olan profiller için incelenebilir.",
                "Salicylic acid içeriği gözenek görünümü hedefiyle ilişkilendirilebilir.",
            ),
            watchouts = listOf(
                "Asit içeriği bazı hassas ciltlerde kuruluk veya batma hissiyle ilişkilendirilebilir.",
                "Bariyer hassasiyeti yüksekse kullanım sıklığı dikkatle değerlendirilmelidir.",
            ),
            compatibilityNotes = listOf(
                "Asitlere tetikleyici işareti verdiyseniz ürün ayrıntısı düşük güvenle ele alınır.",
                "Benzer kullanıcı sonucu verisi henüz bağlı değil.",
            ),
            rawIngredientText = "Aqua, Cocamidopropyl Betaine, Glycerin, Salicylic Acid, Zinc PCA, Sodium Chloride, Phenoxyethanol, Citric Acid.",
            normalizedIngredients = listOf(
                IngredientItem("Salicylic Acid", "Salisilik asit", "Eksfoliyan destek", DataConfidence.MEDIUM, "Asit tetikleyicileri için dikkat notu oluşturur."),
                IngredientItem("Zinc PCA", "Çinko PCA", "Yağ dengesi desteği", DataConfidence.MEDIUM, "Yağlanma hedefiyle ilişkili olabilir."),
                IngredientItem("Cocamidopropyl Betaine", "Cocamidopropyl betaine", "Yüzey aktif", DataConfidence.LOW, "Kaynak güveni sınırlı."),
            ),
            confidenceNote = "Düşük güven. Ürün verisi doğrulanmadan güçlü uyum yorumu yapılmaz.",
        ),
        ProductDetail(
            id = "tr-purelab-gentle-hydration-cleanser",
            globalProductName = "Gentle Hydration Cleanser",
            marketProductName = "Gentle Hydration Cleanser",
            brand = "Purelab",
            category = "Temizleyici",
            texture = "Krem-jel",
            verificationStatus = VerificationStatus.LABEL_REVIEW,
            dataConfidence = DataConfidence.MEDIUM,
            localStatusNote = "İçerik metni doğrulanıyor. Türkiye pazarı için nihai ürün eşleşmesi bekliyor.",
            skinFitPlaceholder = "Temizleyici uyumu backend tarafından profil ve geçmiş ile değerlendirilecek.",
            whyThisMayFit = listOf(
                "Nemsizlik hissi olan profiller için nazik temizleyici adayı olabilir.",
                "Parfüm içeriği tespit edilmedi.",
            ),
            watchouts = listOf(
                "Tüm temizleyicilerde olduğu gibi kuruluk hissi kişisel geçmişe göre değişebilir.",
            ),
            compatibilityNotes = listOf(
                "Gliserin ve allantoin nem ve yatıştırıcı destek ile ilişkilendirilebilir.",
            ),
            rawIngredientText = "Aqua, Glycerin, Coco-Glucoside, Allantoin, Sodium Cocoyl Glutamate, Betaine, Sodium Benzoate, Potassium Sorbate.",
            normalizedIngredients = listOf(
                IngredientItem("Glycerin", "Gliserin", "Nem tutucu", DataConfidence.HIGH, "Normalize eşleşme güçlü."),
                IngredientItem("Allantoin", "Allantoin", "Yatıştırıcı destek", DataConfidence.MEDIUM, "Hassasiyet hedeflerinde izlenebilir."),
                IngredientItem("Betaine", "Betain", "Nem desteği", DataConfidence.MEDIUM, "Kaynak eşleşmesi orta."),
            ),
            confidenceNote = "Veri güveni orta; içerik metni doğrulama kuyruğunda.",
        ),
    )

    override suspend fun search(query: String): List<ProductSearchResult> {
        delay(450)
        val turkishLocale = Locale.forLanguageTag("tr-TR")
        val normalizedQuery = query.trim().lowercase(turkishLocale)
        if (normalizedQuery.contains("hata")) {
            error("Mock search error")
        }
        if (normalizedQuery.isBlank()) return emptyList()
        return products
            .filter { product ->
                val haystack = listOf(
                    product.brand,
                    product.marketProductName,
                    product.globalProductName,
                    product.category,
                    product.rawIngredientText,
                ).joinToString(" ").lowercase(turkishLocale)
                haystack.contains(normalizedQuery)
            }
            .map { it.searchResult }
    }

    override suspend fun detail(productId: String): ProductDetail {
        delay(350)
        return products.firstOrNull { it.id == productId }
            ?: error("Product not found")
    }
}

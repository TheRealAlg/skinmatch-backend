package com.skinmatch.mvp.domain.models

data class ProfileOption(
    val id: String,
    val label: String,
)

data class ProfileField(
    val key: String,
    val title: String,
    val helper: String,
    val options: List<ProfileOption>,
)

data class SkinProfile(
    val skinType: String = "not_sure",
    val sensitivityLevel: String = "not_sure",
    val oilinessPattern: String = "not_sure",
    val drynessPattern: String = "not_sure",
    val poresLevel: String = "not_sure",
    val blackheadTendency: String = "not_sure",
    val cloggedPoreTendency: String = "not_sure",
    val acneProneBehavior: String = "not_sure",
    val rednessTendency: String = "not_sure",
    val hyperpigmentationLevel: String = "not_sure",
    val textureConcernLevel: String = "not_sure",
    val dehydrationLevel: String = "not_sure",
    val barrierDamageLevel: String = "not_sure",
    val goals: Set<String> = emptySet(),
    val knownTriggers: Set<String> = emptySet(),
) {
    fun valueFor(key: String): String = when (key) {
        FieldKeys.SKIN_TYPE -> skinType
        FieldKeys.SENSITIVITY_LEVEL -> sensitivityLevel
        FieldKeys.OILINESS_PATTERN -> oilinessPattern
        FieldKeys.DRYNESS_PATTERN -> drynessPattern
        FieldKeys.PORES_LEVEL -> poresLevel
        FieldKeys.BLACKHEAD_TENDENCY -> blackheadTendency
        FieldKeys.CLOGGED_PORE_TENDENCY -> cloggedPoreTendency
        FieldKeys.ACNE_PRONE_BEHAVIOR -> acneProneBehavior
        FieldKeys.REDNESS_TENDENCY -> rednessTendency
        FieldKeys.HYPERPIGMENTATION_LEVEL -> hyperpigmentationLevel
        FieldKeys.TEXTURE_CONCERN_LEVEL -> textureConcernLevel
        FieldKeys.DEHYDRATION_LEVEL -> dehydrationLevel
        FieldKeys.BARRIER_DAMAGE_LEVEL -> barrierDamageLevel
        else -> "not_sure"
    }

    fun withChoice(key: String, value: String): SkinProfile = when (key) {
        FieldKeys.SKIN_TYPE -> copy(skinType = value)
        FieldKeys.SENSITIVITY_LEVEL -> copy(sensitivityLevel = value)
        FieldKeys.OILINESS_PATTERN -> copy(oilinessPattern = value)
        FieldKeys.DRYNESS_PATTERN -> copy(drynessPattern = value)
        FieldKeys.PORES_LEVEL -> copy(poresLevel = value)
        FieldKeys.BLACKHEAD_TENDENCY -> copy(blackheadTendency = value)
        FieldKeys.CLOGGED_PORE_TENDENCY -> copy(cloggedPoreTendency = value)
        FieldKeys.ACNE_PRONE_BEHAVIOR -> copy(acneProneBehavior = value)
        FieldKeys.REDNESS_TENDENCY -> copy(rednessTendency = value)
        FieldKeys.HYPERPIGMENTATION_LEVEL -> copy(hyperpigmentationLevel = value)
        FieldKeys.TEXTURE_CONCERN_LEVEL -> copy(textureConcernLevel = value)
        FieldKeys.DEHYDRATION_LEVEL -> copy(dehydrationLevel = value)
        FieldKeys.BARRIER_DAMAGE_LEVEL -> copy(barrierDamageLevel = value)
        else -> this
    }

    fun toggleGoal(goalId: String): SkinProfile = copy(
        goals = if (goals.contains(goalId)) goals - goalId else goals + goalId,
    )

    fun toggleTrigger(triggerId: String): SkinProfile = copy(
        knownTriggers = if (knownTriggers.contains(triggerId)) knownTriggers - triggerId else knownTriggers + triggerId,
    )
}

object FieldKeys {
    const val SKIN_TYPE = "skinType"
    const val SENSITIVITY_LEVEL = "sensitivityLevel"
    const val OILINESS_PATTERN = "oilinessPattern"
    const val DRYNESS_PATTERN = "drynessPattern"
    const val PORES_LEVEL = "poresLevel"
    const val BLACKHEAD_TENDENCY = "blackheadTendency"
    const val CLOGGED_PORE_TENDENCY = "cloggedPoreTendency"
    const val ACNE_PRONE_BEHAVIOR = "acneProneBehavior"
    const val REDNESS_TENDENCY = "rednessTendency"
    const val HYPERPIGMENTATION_LEVEL = "hyperpigmentationLevel"
    const val TEXTURE_CONCERN_LEVEL = "textureConcernLevel"
    const val DEHYDRATION_LEVEL = "dehydrationLevel"
    const val BARRIER_DAMAGE_LEVEL = "barrierDamageLevel"
}

val SkinProfileFields = listOf(
    ProfileField(
        key = FieldKeys.SKIN_TYPE,
        title = "Cilt tipi",
        helper = "Gün içinde cildinizin genel hissettirdiği durumu seçin.",
        options = listOf(
            ProfileOption("oily", "Yağlı"),
            ProfileOption("dry", "Kuru"),
            ProfileOption("combination", "Karma"),
            ProfileOption("normal", "Normal"),
            ProfileOption("not_sure", "Emin değilim"),
        ),
    ),
    ProfileField(
        key = FieldKeys.SENSITIVITY_LEVEL,
        title = "Hassasiyet",
        helper = "Yeni ürünlere verdiğiniz tepki sıklığını düşünün.",
        options = levelOptions(),
    ),
    ProfileField(
        key = FieldKeys.OILINESS_PATTERN,
        title = "Yağlanma düzeni",
        helper = "Yağlanmanın en belirgin olduğu alanı seçin.",
        options = listOf(
            ProfileOption("none_low", "Yok / düşük"),
            ProfileOption("t_zone", "T bölgesi"),
            ProfileOption("all_over", "Genel"),
            ProfileOption("not_sure", "Bilmiyorum"),
        ),
    ),
    ProfileField(
        key = FieldKeys.DRYNESS_PATTERN,
        title = "Kuruluk düzeni",
        helper = "Kuruluğu en sık hissettiğiniz alanı seçin.",
        options = listOf(
            ProfileOption("none_low", "Yok / düşük"),
            ProfileOption("cheeks", "Yanaklar"),
            ProfileOption("all_over", "Genel"),
            ProfileOption("not_sure", "Bilmiyorum"),
        ),
    ),
    ProfileField(
        key = FieldKeys.PORES_LEVEL,
        title = "Gözenek görünümü",
        helper = "Gözünüze çarpan görünüm seviyesini seçin.",
        options = levelOptions(),
    ),
    ProfileField(
        key = FieldKeys.BLACKHEAD_TENDENCY,
        title = "Siyah nokta eğilimi",
        helper = "Siyah nokta oluşumunu ne sıklıkta fark ediyorsunuz?",
        options = tendencyOptions(),
    ),
    ProfileField(
        key = FieldKeys.CLOGGED_PORE_TENDENCY,
        title = "Tıkanmış gözenek eğilimi",
        helper = "Pütür veya kapalı komedon benzeri görünümü düşünün.",
        options = tendencyOptions(),
    ),
    ProfileField(
        key = FieldKeys.ACNE_PRONE_BEHAVIOR,
        title = "Sivilceye yatkınlık",
        helper = "Dönemsel veya sık tekrar eden çıkışları işaretleyin.",
        options = listOf(
            ProfileOption("rarely", "Nadiren"),
            ProfileOption("occasional", "Ara sıra"),
            ProfileOption("frequent", "Sık"),
            ProfileOption("not_sure", "Bilmiyorum"),
        ),
    ),
    ProfileField(
        key = FieldKeys.REDNESS_TENDENCY,
        title = "Kızarıklık eğilimi",
        helper = "Kızarıklığın sizde ne kadar belirgin olduğunu seçin.",
        options = levelOptions(),
    ),
    ProfileField(
        key = FieldKeys.HYPERPIGMENTATION_LEVEL,
        title = "Leke görünümü",
        helper = "Koyu iz veya ton eşitsizliği seviyesini seçin.",
        options = levelOptions(),
    ),
    ProfileField(
        key = FieldKeys.TEXTURE_CONCERN_LEVEL,
        title = "Doku endişesi",
        helper = "Pürüz, düzensiz his veya yüzey görünümünü düşünün.",
        options = levelOptions(),
    ),
    ProfileField(
        key = FieldKeys.DEHYDRATION_LEVEL,
        title = "Nemsizlik hissi",
        helper = "Gerginlik veya susuz görünüm sıklığını seçin.",
        options = levelOptions(),
    ),
    ProfileField(
        key = FieldKeys.BARRIER_DAMAGE_LEVEL,
        title = "Bariyer hassasiyeti",
        helper = "Yanma, batma veya kolay tahriş hissini düşünün.",
        options = levelOptions(),
    ),
)

val GoalOptions = listOf(
    ProfileOption("reduce_blackheads", "Siyah noktayı azalt"),
    ProfileOption("reduce_breakouts", "Çıkışları azalt"),
    ProfileOption("improve_texture", "Doku görünümünü iyileştir"),
    ProfileOption("improve_hydration", "Nemi destekle"),
    ProfileOption("repair_barrier", "Bariyeri destekle"),
    ProfileOption("reduce_redness", "Kızarıklığı azalt"),
    ProfileOption("reduce_oiliness", "Yağlanmayı dengele"),
    ProfileOption("improve_dark_spots", "Leke görünümünü azalt"),
    ProfileOption("reduce_dullness", "Mat görünümü azalt"),
    ProfileOption("maintain_skin_health", "Cilt sağlığını koru"),
)

val TriggerOptions = listOf(
    ProfileOption("fragrance", "Parfüm"),
    ProfileOption("alcohol_denat", "Alcohol denat."),
    ProfileOption("acids", "Asitler"),
    ProfileOption("retinoids", "Retinoidler"),
    ProfileOption("essential_oils", "Uçucu yağlar"),
    ProfileOption("heavy_creams", "Yoğun kremler"),
    ProfileOption("not_sure", "Bilmiyorum"),
)

fun optionLabel(options: List<ProfileOption>, id: String): String {
    return options.firstOrNull { it.id == id }?.label ?: "Bilmiyorum"
}

private fun levelOptions() = listOf(
    ProfileOption("low", "Düşük"),
    ProfileOption("medium", "Orta"),
    ProfileOption("high", "Yüksek"),
    ProfileOption("not_sure", "Bilmiyorum"),
)

private fun tendencyOptions() = listOf(
    ProfileOption("rarely", "Nadiren"),
    ProfileOption("sometimes", "Bazen"),
    ProfileOption("often", "Sık"),
    ProfileOption("not_sure", "Bilmiyorum"),
)

package com.skinmatch.mvp.ui.assets

import com.skinmatch.mvp.R

enum class SkinMatchEmptyIllustration {
    ConsentRequired,
    LowDataConfidence,
    NoSavedProducts,
    NoSearchResults,
    ProfileIncomplete,
}

fun productFallbackDrawableForCategory(category: String?): Int {
    val normalized = category.orEmpty().lowercase()
    return when {
        normalized.hasAny("serum") -> R.drawable.skinmatch_product_fallback_serum
        normalized.hasAny("cleanser", "temiz", "wash", "gel") -> R.drawable.skinmatch_product_fallback_cleanser
        normalized.hasAny("sunscreen", "spf", "gunes", "sun") -> R.drawable.skinmatch_product_fallback_sunscreen
        normalized.hasAny("moisturizer", "nem", "cream", "krem", "lotion", "losyon") ->
            R.drawable.skinmatch_product_fallback_moisturizer
        normalized.hasAny("toner", "tonik") -> R.drawable.skinmatch_product_fallback_toner
        normalized.hasAny("mask", "maske") -> R.drawable.skinmatch_product_fallback_mask
        else -> R.drawable.skinmatch_product_fallback_unknown
    }
}

fun emptyIllustrationDrawable(type: SkinMatchEmptyIllustration): Int {
    return when (type) {
        SkinMatchEmptyIllustration.ConsentRequired -> R.drawable.skinmatch_empty_consent_required
        SkinMatchEmptyIllustration.LowDataConfidence -> R.drawable.skinmatch_empty_low_data_confidence
        SkinMatchEmptyIllustration.NoSavedProducts -> R.drawable.skinmatch_empty_no_saved_products
        SkinMatchEmptyIllustration.NoSearchResults -> R.drawable.skinmatch_empty_no_search_results
        SkinMatchEmptyIllustration.ProfileIncomplete -> R.drawable.skinmatch_empty_profile_incomplete
    }
}

fun skinProfileAvatarReferenceDrawable(): Int = R.drawable.skinmatch_skin_profile_avatar_reference

private fun String.hasAny(vararg needles: String): Boolean {
    return needles.any { contains(it) }
}

package com.skinmatch.mvp.data.repository

import com.skinmatch.mvp.domain.models.SkinProfile
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class ConsentRequiredException : IllegalStateException("Active consent is required before writing skin profile data.")

interface SkinProfileRepository {
    val profile: StateFlow<SkinProfile?>
    suspend fun saveProfile(profile: SkinProfile, hasActiveConsent: Boolean)
    suspend fun clearProfile()
}

class MockSkinProfileRepository : SkinProfileRepository {
    private val mutableProfile = MutableStateFlow<SkinProfile?>(null)
    override val profile: StateFlow<SkinProfile?> = mutableProfile.asStateFlow()

    override suspend fun saveProfile(profile: SkinProfile, hasActiveConsent: Boolean) {
        if (!hasActiveConsent) throw ConsentRequiredException()
        mutableProfile.value = profile
    }

    override suspend fun clearProfile() {
        mutableProfile.value = null
    }
}

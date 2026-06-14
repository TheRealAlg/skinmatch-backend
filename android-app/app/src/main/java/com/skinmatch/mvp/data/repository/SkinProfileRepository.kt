package com.skinmatch.mvp.data.repository

import com.skinmatch.mvp.data.api.SkinMatchApi
import com.skinmatch.mvp.data.dto.KnownTriggerDto
import com.skinmatch.mvp.data.dto.SkinGoalDto
import com.skinmatch.mvp.data.dto.SkinProfileDto
import com.skinmatch.mvp.data.dto.UpdateSkinProfileRequestDto
import com.skinmatch.mvp.domain.models.SkinProfile
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

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

class RetrofitSkinProfileRepository(
    private val api: SkinMatchApi,
    private val sessionRepository: SessionRepository,
) : SkinProfileRepository {
    private val repositoryScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val mutableProfile = MutableStateFlow<SkinProfile?>(null)
    override val profile: StateFlow<SkinProfile?> = mutableProfile.asStateFlow()

    init {
        repositoryScope.launch {
            runCatching { refreshProfile() }
        }
    }

    override suspend fun saveProfile(profile: SkinProfile, hasActiveConsent: Boolean) {
        if (!hasActiveConsent) throw ConsentRequiredException()
        val data = api.updateSkinProfile(
            authorization = sessionRepository.authHeader(),
            request = profile.toUpdateRequest(),
        ).requireApiData("Skin profile")

        mutableProfile.value = data.profile?.toDomain() ?: profile
    }

    override suspend fun clearProfile() {
        mutableProfile.value = null
    }

    private suspend fun refreshProfile() {
        val data = api.getSkinProfile(sessionRepository.authHeader()).requireApiData("Skin profile")
        mutableProfile.value = data.profile?.toDomain()
    }
}

private fun SkinProfile.toUpdateRequest() = UpdateSkinProfileRequestDto(
    skinType = skinType,
    sensitivityLevel = sensitivityLevel,
    oilinessPattern = oilinessPattern,
    drynessPattern = drynessPattern,
    poresLevel = poresLevel,
    blackheadTendency = blackheadTendency,
    cloggedPoreTendency = cloggedPoreTendency,
    acneTendency = acneProneBehavior,
    rednessTendency = rednessTendency,
    hyperpigmentationLevel = hyperpigmentationLevel,
    textureConcernLevel = textureConcernLevel,
    dehydrationLevel = dehydrationLevel,
    barrierDamageLevel = barrierDamageLevel,
    goals = goals.sorted().mapIndexed { index, goalKey ->
        SkinGoalDto(goalKey = goalKey, priority = index + 1)
    },
    knownTriggers = knownTriggers.sorted().map { triggerKey ->
        KnownTriggerDto(triggerKey = triggerKey, severity = "medium")
    },
)

private fun SkinProfileDto.toDomain() = SkinProfile(
    skinType = skinType.orDefault(),
    sensitivityLevel = sensitivityLevel.orDefault(),
    oilinessPattern = oilinessPattern.orDefault(),
    drynessPattern = drynessPattern.orDefault(),
    poresLevel = poresLevel.orDefault(),
    blackheadTendency = blackheadTendency.orDefault(),
    cloggedPoreTendency = cloggedPoreTendency.orDefault(),
    acneProneBehavior = acneTendency.orDefault(),
    rednessTendency = rednessTendency.orDefault(),
    hyperpigmentationLevel = hyperpigmentationLevel.orDefault(),
    textureConcernLevel = textureConcernLevel.orDefault(),
    dehydrationLevel = dehydrationLevel.orDefault(),
    barrierDamageLevel = barrierDamageLevel.orDefault(),
    goals = goals.mapNotNull { it.goalKey?.takeIf(String::isNotBlank) }.toSet(),
    knownTriggers = triggers.mapNotNull { it.triggerKey?.takeIf(String::isNotBlank) }.toSet(),
)

private fun String?.orDefault(): String = takeIf { !it.isNullOrBlank() } ?: "not_sure"

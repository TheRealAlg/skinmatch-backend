package com.skinmatch.mvp.data.repository

import com.skinmatch.mvp.data.api.SkinMatchApi
import com.skinmatch.mvp.data.dto.ConsentDto
import com.skinmatch.mvp.data.dto.UpsertConsentRequestDto
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ConsentState(
    val privacyNoticeAccepted: Boolean = false,
    val skinProfileProcessingAccepted: Boolean = false,
    val productDiscoveryResearchAccepted: Boolean = false,
) {
    val canWriteSensitiveProfile: Boolean
        get() = privacyNoticeAccepted && skinProfileProcessingAccepted
}

interface ConsentRepository {
    val consentState: StateFlow<ConsentState>
    suspend fun updateConsent(state: ConsentState)
}

class MockConsentRepository : ConsentRepository {
    private val mutableConsent = MutableStateFlow(ConsentState())
    override val consentState: StateFlow<ConsentState> = mutableConsent.asStateFlow()

    override suspend fun updateConsent(state: ConsentState) {
        mutableConsent.value = state
    }
}

class RetrofitConsentRepository(
    private val api: SkinMatchApi,
    private val sessionRepository: SessionRepository,
) : ConsentRepository {
    private val repositoryScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val mutableConsent = MutableStateFlow(ConsentState())
    override val consentState: StateFlow<ConsentState> = mutableConsent.asStateFlow()

    init {
        repositoryScope.launch {
            runCatching { refreshConsentState() }
        }
    }

    override suspend fun updateConsent(state: ConsentState) {
        val authorization = sessionRepository.authHeader()
        recordConsent(
            authorization = authorization,
            consentType = ACCOUNT_TERMS,
            accepted = state.privacyNoticeAccepted,
        )
        recordConsent(
            authorization = authorization,
            consentType = SKIN_PROFILE_PROCESSING,
            accepted = state.skinProfileProcessingAccepted,
        )
        recordConsent(
            authorization = authorization,
            consentType = ANALYTICS_OPTIONAL,
            accepted = state.productDiscoveryResearchAccepted,
        )
        mutableConsent.value = state
    }

    private suspend fun refreshConsentState() {
        val data = api.getConsents(sessionRepository.authHeader()).requireApiData("Consents")
        mutableConsent.value = data.consents.toConsentState()
    }

    private suspend fun recordConsent(
        authorization: String,
        consentType: String,
        accepted: Boolean,
    ) {
        api.recordConsent(
            authorization = authorization,
            request = UpsertConsentRequestDto(
                consentType = consentType,
                consentVersion = CONSENT_VERSION,
                status = if (accepted) ACCEPTED else REVOKED,
            ),
        ).requireApiData("Consent")
    }
}

private fun List<ConsentDto>.toConsentState() = ConsentState(
    privacyNoticeAccepted = isAccepted(ACCOUNT_TERMS),
    skinProfileProcessingAccepted = isAccepted(SKIN_PROFILE_PROCESSING),
    productDiscoveryResearchAccepted = isAccepted(ANALYTICS_OPTIONAL),
)

private fun List<ConsentDto>.isAccepted(consentType: String): Boolean {
    return firstOrNull { it.consentType == consentType }?.status == ACCEPTED
}

private const val CONSENT_VERSION = "2026-06-08-v1"
private const val ACCOUNT_TERMS = "account_terms"
private const val SKIN_PROFILE_PROCESSING = "skin_profile_processing"
private const val ANALYTICS_OPTIONAL = "analytics_optional"
private const val ACCEPTED = "accepted"
private const val REVOKED = "revoked"

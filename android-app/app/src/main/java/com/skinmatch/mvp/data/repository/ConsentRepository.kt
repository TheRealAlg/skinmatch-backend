package com.skinmatch.mvp.data.repository

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

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

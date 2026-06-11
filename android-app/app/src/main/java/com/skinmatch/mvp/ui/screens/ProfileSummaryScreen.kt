package com.skinmatch.mvp.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.FaceRetouchingNatural
import androidx.compose.material.icons.rounded.Flag
import androidx.compose.material.icons.rounded.WarningAmber
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import com.skinmatch.mvp.data.repository.ConsentRepository
import com.skinmatch.mvp.data.repository.ConsentState
import com.skinmatch.mvp.data.repository.SkinProfileRepository
import com.skinmatch.mvp.domain.models.GoalOptions
import com.skinmatch.mvp.domain.models.SkinProfile
import com.skinmatch.mvp.domain.models.SkinProfileFields
import com.skinmatch.mvp.domain.models.TriggerOptions
import com.skinmatch.mvp.domain.models.UiStatus
import com.skinmatch.mvp.domain.models.optionLabel
import com.skinmatch.mvp.ui.components.ConsentBlockedState
import com.skinmatch.mvp.ui.components.EmptyState
import com.skinmatch.mvp.ui.components.InlineStatusRow
import com.skinmatch.mvp.ui.components.OptionFlow
import com.skinmatch.mvp.ui.components.PremiumBackground
import com.skinmatch.mvp.ui.components.PrimaryActionButton
import com.skinmatch.mvp.ui.components.ScreenColumn
import com.skinmatch.mvp.ui.components.SecondaryActionButton
import com.skinmatch.mvp.ui.components.SelectablePill
import com.skinmatch.mvp.ui.components.SectionCard
import com.skinmatch.mvp.ui.theme.Ink
import com.skinmatch.mvp.ui.theme.MutedInk
import com.skinmatch.mvp.ui.theme.Terracotta
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ProfileSummaryUiState(
    val status: UiStatus = UiStatus.LOADING,
    val consent: ConsentState = ConsentState(),
    val profile: SkinProfile? = null,
)

class ProfileSummaryViewModel(
    private val skinProfileRepository: SkinProfileRepository,
    private val consentRepository: ConsentRepository,
) : ViewModel() {
    private val mutableState = MutableStateFlow(ProfileSummaryUiState())
    val uiState: StateFlow<ProfileSummaryUiState> = mutableState.asStateFlow()

    init {
        viewModelScope.launch {
            consentRepository.consentState.collect { consent ->
                val current = mutableState.value
                mutableState.value = current.copy(
                    consent = consent,
                    status = statusFor(consent, current.profile),
                )
            }
        }
        viewModelScope.launch {
            skinProfileRepository.profile.collect { profile ->
                val current = mutableState.value
                mutableState.value = current.copy(
                    profile = profile,
                    status = statusFor(current.consent, profile),
                )
            }
        }
    }

    private fun statusFor(consent: ConsentState, profile: SkinProfile?): UiStatus {
        if (!consent.canWriteSensitiveProfile) return UiStatus.CONSENT_BLOCKED
        return if (profile == null) UiStatus.EMPTY else UiStatus.READY
    }
}

@Composable
fun ProfileSummaryScreen(
    viewModel: ProfileSummaryViewModel,
    onOpenConsent: () -> Unit,
    onEditProfile: () -> Unit,
    onContinue: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    PremiumBackground {
        ScreenColumn {
            Text("SkinMatch", style = MaterialTheme.typography.headlineMedium, color = Terracotta)
            Text("Profil özeti", style = MaterialTheme.typography.displayMedium, color = Ink)
            Text(
                "Bu özet ürün arama ve içerik notlarını kişiselleştirmeye hazırlık sağlar. Yerel öneri skoru hesaplanmaz.",
                style = MaterialTheme.typography.bodyLarge,
                color = MutedInk,
            )

            ProfileSummaryContent(
                uiState = uiState,
                onOpenConsent = onOpenConsent,
                onEditProfile = onEditProfile,
            )

            if (uiState.profile != null && uiState.status == UiStatus.READY) {
                PrimaryActionButton(text = "Ana sayfaya geç", onClick = onContinue)
            }
        }
    }
}

@Composable
fun ProfileSummaryContent(
    uiState: ProfileSummaryUiState,
    onOpenConsent: () -> Unit,
    onEditProfile: () -> Unit,
) {
    when (uiState.status) {
        UiStatus.CONSENT_BLOCKED -> ConsentBlockedState(onOpenConsent)
        UiStatus.EMPTY -> EmptyState("Cilt profiliniz henüz yok. Profil oluşturunca ürün verileri daha anlamlı okunur.")
        UiStatus.READY -> uiState.profile?.let { profile ->
            SummarySection(
                icon = Icons.Rounded.FaceRetouchingNatural,
                title = "Cilt davranışı",
                body = "Profil alanlarınız backend V1 adlarıyla saklanmaya hazır.",
            ) {
                SkinProfileFields.forEach { field ->
                    Text(
                        text = "${field.title}: ${optionLabel(field.options, profile.valueFor(field.key))}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Ink,
                    )
                }
            }

            SummarySection(
                icon = Icons.Rounded.Flag,
                title = "Hedefler",
                body = "Seçimler ürün keşfinde filtreleme sinyali olarak kullanılacak.",
            ) {
                OptionFlow {
                    selectedLabels(GoalOptions, profile.goals).forEach { label ->
                        SelectablePill(text = label, selected = true, onClick = {})
                    }
                }
            }

            SummarySection(
                icon = Icons.Rounded.WarningAmber,
                title = "Dikkat edilecek içerikler",
                body = "Bu alan tanı değildir; yalnızca daha temkinli ürün okuması sağlar.",
            ) {
                OptionFlow {
                    selectedLabels(TriggerOptions, profile.knownTriggers).forEach { label ->
                        SelectablePill(text = label, selected = true, onClick = {})
                    }
                }
            }

            SecondaryActionButton(text = "Profili düzenle", onClick = onEditProfile)
        }
        else -> EmptyState("Profil özeti hazırlanıyor.")
    }
}

@Composable
private fun SummarySection(
    icon: ImageVector,
    title: String,
    body: String,
    content: @Composable () -> Unit,
) {
    SectionCard {
        InlineStatusRow(icon = icon, title = title, body = body)
        androidx.compose.foundation.layout.Column(
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            content()
        }
    }
}

private fun selectedLabels(
    options: List<com.skinmatch.mvp.domain.models.ProfileOption>,
    selected: Set<String>,
): List<String> {
    val labels = options.filter { selected.contains(it.id) }.map { it.label }
    return labels.ifEmpty { listOf("Bilmiyorum") }
}

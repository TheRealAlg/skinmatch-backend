package com.skinmatch.mvp.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.FaceRetouchingNatural
import androidx.compose.material.icons.rounded.HealthAndSafety
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import com.skinmatch.mvp.data.repository.ConsentRepository
import com.skinmatch.mvp.data.repository.ConsentState
import com.skinmatch.mvp.data.repository.SkinProfileRepository
import com.skinmatch.mvp.domain.models.FieldKeys
import com.skinmatch.mvp.domain.models.GoalOptions
import com.skinmatch.mvp.domain.models.ProfileField
import com.skinmatch.mvp.domain.models.SkinProfile
import com.skinmatch.mvp.domain.models.SkinProfileFields
import com.skinmatch.mvp.domain.models.TriggerOptions
import com.skinmatch.mvp.domain.models.UiStatus
import com.skinmatch.mvp.ui.components.ConsentBlockedState
import com.skinmatch.mvp.ui.components.ErrorState
import com.skinmatch.mvp.ui.components.InlineStatusRow
import com.skinmatch.mvp.ui.components.LoadingState
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
import kotlin.math.roundToInt

data class SkinProfileOnboardingUiState(
    val status: UiStatus = UiStatus.LOADING,
    val consent: ConsentState = ConsentState(),
    val draft: SkinProfile = SkinProfile(),
    val stepIndex: Int = 0,
    val errorMessage: String? = null,
) {
    val currentStep: ProfileStep
        get() = ProfileSteps[stepIndex]

    val progress: Float
        get() = (stepIndex + 1).toFloat() / ProfileSteps.size.toFloat()
}

class SkinProfileOnboardingViewModel(
    private val skinProfileRepository: SkinProfileRepository,
    private val consentRepository: ConsentRepository,
) : ViewModel() {
    private val mutableState = MutableStateFlow(SkinProfileOnboardingUiState())
    val uiState: StateFlow<SkinProfileOnboardingUiState> = mutableState.asStateFlow()

    init {
        viewModelScope.launch {
            consentRepository.consentState.collect { consent ->
                mutableState.value = mutableState.value.copy(
                    consent = consent,
                    status = if (consent.canWriteSensitiveProfile) UiStatus.READY else UiStatus.CONSENT_BLOCKED,
                )
            }
        }
        viewModelScope.launch {
            skinProfileRepository.profile.collect { savedProfile ->
                if (savedProfile != null) {
                    mutableState.value = mutableState.value.copy(draft = savedProfile)
                }
            }
        }
    }

    fun selectChoice(fieldKey: String, optionId: String) {
        mutableState.value = mutableState.value.copy(
            draft = mutableState.value.draft.withChoice(fieldKey, optionId),
            errorMessage = null,
        )
    }

    fun toggleGoal(goalId: String) {
        mutableState.value = mutableState.value.copy(
            draft = mutableState.value.draft.toggleGoal(goalId),
            errorMessage = null,
        )
    }

    fun toggleTrigger(triggerId: String) {
        mutableState.value = mutableState.value.copy(
            draft = mutableState.value.draft.toggleTrigger(triggerId),
            errorMessage = null,
        )
    }

    fun next() {
        val current = mutableState.value
        if (current.stepIndex < ProfileSteps.lastIndex) {
            mutableState.value = current.copy(stepIndex = current.stepIndex + 1)
        }
    }

    fun previous() {
        val current = mutableState.value
        if (current.stepIndex > 0) {
            mutableState.value = current.copy(stepIndex = current.stepIndex - 1)
        }
    }

    fun save(onSaved: () -> Unit) {
        val current = mutableState.value
        if (!current.consent.canWriteSensitiveProfile) {
            mutableState.value = current.copy(status = UiStatus.CONSENT_BLOCKED)
            return
        }

        viewModelScope.launch {
            try {
                mutableState.value = current.copy(status = UiStatus.LOADING)
                skinProfileRepository.saveProfile(
                    profile = current.draft,
                    hasActiveConsent = current.consent.canWriteSensitiveProfile,
                )
                mutableState.value = mutableState.value.copy(status = UiStatus.READY)
                onSaved()
            } catch (error: Throwable) {
                mutableState.value = mutableState.value.copy(
                    status = UiStatus.ERROR,
                    errorMessage = "Profil kaydedilemedi. Onay durumunu kontrol edip tekrar deneyin.",
                )
            }
        }
    }
}

@Composable
fun SkinProfileOnboardingScreen(
    viewModel: SkinProfileOnboardingViewModel,
    onOpenConsent: () -> Unit,
    onComplete: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    PremiumBackground {
        ScreenColumn {
            Text("SkinMatch", style = MaterialTheme.typography.headlineMedium, color = Terracotta)
            Text("Cildinizi anlatın", style = MaterialTheme.typography.displayMedium, color = Ink)
            Text(
                "Bu bilgiler tanı koymak için değil; ürün verisini profilinizle daha dikkatli okumak için kullanılır.",
                style = MaterialTheme.typography.bodyLarge,
                color = MutedInk,
            )

            when (uiState.status) {
                UiStatus.LOADING -> LoadingState("Profil hazırlanıyor")
                UiStatus.ERROR -> ErrorState(
                    body = uiState.errorMessage ?: "Profil akışı şu anda tamamlanamadı.",
                    onRetry = { viewModel.save(onComplete) },
                )
                UiStatus.CONSENT_BLOCKED -> ConsentBlockedState(onOpenConsent)
                else -> OnboardingStepContent(
                    uiState = uiState,
                    onSelectChoice = viewModel::selectChoice,
                    onToggleGoal = viewModel::toggleGoal,
                    onToggleTrigger = viewModel::toggleTrigger,
                    onPrevious = viewModel::previous,
                    onNext = viewModel::next,
                    onSave = { viewModel.save(onComplete) },
                )
            }
        }
    }
}

@Composable
private fun OnboardingStepContent(
    uiState: SkinProfileOnboardingUiState,
    onSelectChoice: (String, String) -> Unit,
    onToggleGoal: (String) -> Unit,
    onToggleTrigger: (String) -> Unit,
    onPrevious: () -> Unit,
    onNext: () -> Unit,
    onSave: () -> Unit,
) {
    val step = uiState.currentStep
    val progressPercent = (uiState.progress * 100).roundToInt()

    SectionCard {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = "Adım ${uiState.stepIndex + 1} / ${ProfileSteps.size}",
                style = MaterialTheme.typography.titleMedium,
                color = Terracotta,
                fontWeight = FontWeight.SemiBold,
            )
            Text("$progressPercent%", style = MaterialTheme.typography.labelLarge, color = MutedInk)
        }
        LinearProgressIndicator(
            progress = { uiState.progress },
            modifier = Modifier.fillMaxWidth(),
            color = Terracotta,
            trackColor = androidx.compose.ui.graphics.Color(0xFFE8D9CA),
        )
        InlineStatusRow(
            icon = step.icon,
            title = step.title,
            body = step.subtitle,
        )
    }

    when (step.type) {
        StepType.SingleChoiceFields -> step.fields.forEach { field ->
            ProfileFieldCard(
                field = field,
                selectedValue = uiState.draft.valueFor(field.key),
                onSelect = { optionId -> onSelectChoice(field.key, optionId) },
            )
        }

        StepType.Goals -> MultiSelectCard(
            title = "Öncelikli hedefler",
            helper = "Ürün keşfinde hangi cilt hedefleriyle başlamamızı istersiniz?",
            options = GoalOptions,
            selected = uiState.draft.goals,
            onToggle = onToggleGoal,
        )

        StepType.Triggers -> MultiSelectCard(
            title = "Bilinen tetikleyiciler",
            helper = "Emin değilseniz Bilmiyorum seçeneğini işaretleyebilirsiniz.",
            options = TriggerOptions,
            selected = uiState.draft.knownTriggers,
            onToggle = onToggleTrigger,
        )
    }

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        SecondaryActionButton(
            text = "Geri",
            onClick = onPrevious,
            enabled = uiState.stepIndex > 0,
            modifier = Modifier.weight(1f),
        )
        PrimaryActionButton(
            text = if (uiState.stepIndex == ProfileSteps.lastIndex) "Özeti oluştur" else "Devam et",
            onClick = if (uiState.stepIndex == ProfileSteps.lastIndex) onSave else onNext,
            modifier = Modifier.weight(1.2f),
        )
    }
}

@Composable
private fun ProfileFieldCard(
    field: ProfileField,
    selectedValue: String,
    onSelect: (String) -> Unit,
) {
    SectionCard {
        Text(field.title, style = MaterialTheme.typography.titleLarge, color = Ink)
        Text(field.helper, style = MaterialTheme.typography.bodyMedium, color = MutedInk)
        OptionFlow {
            field.options.forEach { option ->
                SelectablePill(
                    text = option.label,
                    selected = selectedValue == option.id,
                    onClick = { onSelect(option.id) },
                )
            }
        }
    }
}

@Composable
private fun MultiSelectCard(
    title: String,
    helper: String,
    options: List<com.skinmatch.mvp.domain.models.ProfileOption>,
    selected: Set<String>,
    onToggle: (String) -> Unit,
) {
    SectionCard {
        Text(title, style = MaterialTheme.typography.titleLarge, color = Ink)
        Text(helper, style = MaterialTheme.typography.bodyMedium, color = MutedInk)
        OptionFlow {
            options.forEach { option ->
                SelectablePill(
                    text = option.label,
                    selected = selected.contains(option.id),
                    onClick = { onToggle(option.id) },
                )
            }
        }
    }
}

data class ProfileStep(
    val title: String,
    val subtitle: String,
    val type: StepType,
    val fields: List<ProfileField> = emptyList(),
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
)

enum class StepType {
    SingleChoiceFields,
    Goals,
    Triggers,
}

private val fieldsByKey = SkinProfileFields.associateBy { it.key }

val ProfileSteps = listOf(
    ProfileStep(
        title = "Temel cilt davranışı",
        subtitle = "Cilt tipi, hassasiyet, yağlanma ve kuruluk düzenini seçin.",
        type = StepType.SingleChoiceFields,
        fields = listOfNotNull(
            fieldsByKey[FieldKeys.SKIN_TYPE],
            fieldsByKey[FieldKeys.SENSITIVITY_LEVEL],
            fieldsByKey[FieldKeys.OILINESS_PATTERN],
            fieldsByKey[FieldKeys.DRYNESS_PATTERN],
        ),
        icon = Icons.Rounded.FaceRetouchingNatural,
    ),
    ProfileStep(
        title = "Gözenek ve çıkış eğilimi",
        subtitle = "Gözenek, siyah nokta, tıkanma ve sivilceye yatkınlık sinyallerini ekleyin.",
        type = StepType.SingleChoiceFields,
        fields = listOfNotNull(
            fieldsByKey[FieldKeys.PORES_LEVEL],
            fieldsByKey[FieldKeys.BLACKHEAD_TENDENCY],
            fieldsByKey[FieldKeys.CLOGGED_PORE_TENDENCY],
            fieldsByKey[FieldKeys.ACNE_PRONE_BEHAVIOR],
        ),
        icon = Icons.Rounded.AutoAwesome,
    ),
    ProfileStep(
        title = "Ton, doku ve bariyer",
        subtitle = "Kızarıklık, leke görünümü, doku, nemsizlik ve bariyer hissini belirtin.",
        type = StepType.SingleChoiceFields,
        fields = listOfNotNull(
            fieldsByKey[FieldKeys.REDNESS_TENDENCY],
            fieldsByKey[FieldKeys.HYPERPIGMENTATION_LEVEL],
            fieldsByKey[FieldKeys.TEXTURE_CONCERN_LEVEL],
            fieldsByKey[FieldKeys.DEHYDRATION_LEVEL],
            fieldsByKey[FieldKeys.BARRIER_DAMAGE_LEVEL],
        ),
        icon = Icons.Rounded.HealthAndSafety,
    ),
    ProfileStep(
        title = "Hedefleriniz",
        subtitle = "Ürün keşfinde öncelik vereceğimiz cilt bakım hedeflerini seçin.",
        type = StepType.Goals,
        icon = Icons.Rounded.AutoAwesome,
    ),
    ProfileStep(
        title = "Dikkat edilecek içerikler",
        subtitle = "Daha önce rahatsızlıkla ilişkilendirdiğiniz içerik veya ürün tiplerini ekleyin.",
        type = StepType.Triggers,
        icon = Icons.Rounded.HealthAndSafety,
    ),
)

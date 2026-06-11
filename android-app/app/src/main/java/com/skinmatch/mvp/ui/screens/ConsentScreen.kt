package com.skinmatch.mvp.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.selection.toggleable
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.Policy
import androidx.compose.material3.Checkbox
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.skinmatch.mvp.data.repository.ConsentRepository
import com.skinmatch.mvp.data.repository.ConsentState
import com.skinmatch.mvp.ui.components.BrandMark
import com.skinmatch.mvp.ui.components.InlineStatusRow
import com.skinmatch.mvp.ui.components.PremiumBackground
import com.skinmatch.mvp.ui.components.PrimaryActionButton
import com.skinmatch.mvp.ui.components.ScreenColumn
import com.skinmatch.mvp.ui.components.SectionCard
import com.skinmatch.mvp.ui.theme.Ink
import com.skinmatch.mvp.ui.theme.MutedInk
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ConsentUiState(
    val consent: ConsentState = ConsentState(),
    val saving: Boolean = false,
) {
    val canContinue: Boolean
        get() = consent.canWriteSensitiveProfile
}

class ConsentViewModel(
    private val consentRepository: ConsentRepository,
) : ViewModel() {
    private val mutableState = MutableStateFlow(ConsentUiState())
    val uiState: StateFlow<ConsentUiState> = mutableState.asStateFlow()

    init {
        viewModelScope.launch {
            consentRepository.consentState.collect { consent ->
                mutableState.value = mutableState.value.copy(consent = consent)
            }
        }
    }

    fun setPrivacyAccepted(value: Boolean) {
        mutableState.value = mutableState.value.copy(
            consent = mutableState.value.consent.copy(privacyNoticeAccepted = value),
        )
    }

    fun setProfileAccepted(value: Boolean) {
        mutableState.value = mutableState.value.copy(
            consent = mutableState.value.consent.copy(skinProfileProcessingAccepted = value),
        )
    }

    fun setDiscoveryAccepted(value: Boolean) {
        mutableState.value = mutableState.value.copy(
            consent = mutableState.value.consent.copy(productDiscoveryResearchAccepted = value),
        )
    }

    fun save(onSaved: () -> Unit) {
        val nextConsent = mutableState.value.consent
        viewModelScope.launch {
            mutableState.value = mutableState.value.copy(saving = true)
            consentRepository.updateConsent(nextConsent)
            mutableState.value = mutableState.value.copy(saving = false)
            onSaved()
        }
    }
}

@Composable
fun ConsentScreen(
    viewModel: ConsentViewModel,
    onContinue: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsState()

    PremiumBackground {
        ScreenColumn {
            BrandMark()
            Text("Onaylar", style = MaterialTheme.typography.displayMedium, color = Ink)
            Text(
                text = "Cilt profili, tetikleyiciler ve hassasiyet bilgileri kişisel ve hassas kabul edilir. Kaydetmeden önce açık onayınızı alırız.",
                style = MaterialTheme.typography.bodyLarge,
                color = MutedInk,
            )

            SectionCard {
                InlineStatusRow(
                    icon = Icons.Rounded.Lock,
                    title = "KVKK ve gizlilik",
                    body = "Bu MVP verileri yalnızca cihaz içindeki mock depolarda tutar. Backend bağlanınca aynı onay kapısı kullanılacak.",
                )
                InlineStatusRow(
                    icon = Icons.Rounded.Policy,
                    title = "Tıbbi yönlendirme değil",
                    body = "Ürün notları tanı, tedavi veya kesin sonuç anlamına gelmez.",
                )
            }

            SectionCard {
                ConsentCheckRow(
                    checked = uiState.consent.privacyNoticeAccepted,
                    title = "Aydınlatma metnini okudum",
                    body = "KVKK bağlamında profil verilerinin nasıl işleneceğini anladım.",
                    onCheckedChange = viewModel::setPrivacyAccepted,
                )
                ConsentCheckRow(
                    checked = uiState.consent.skinProfileProcessingAccepted,
                    title = "Cilt profili işleme onayı veriyorum",
                    body = "Cilt tipi, hassasiyet, tetikleyici ve hedef bilgilerimin profil oluşturmak için kullanılmasını kabul ediyorum.",
                    onCheckedChange = viewModel::setProfileAccepted,
                )
                ConsentCheckRow(
                    checked = uiState.consent.productDiscoveryResearchAccepted,
                    title = "Ürün keşfi geliştirme verisine izin veriyorum",
                    body = "Opsiyonel. Arama davranışı gelecekte katalog kalitesini iyileştirmek için kullanılabilir.",
                    onCheckedChange = viewModel::setDiscoveryAccepted,
                )
            }

            PrimaryActionButton(
                text = if (uiState.saving) "Kaydediliyor" else "Profil sorularına geç",
                enabled = uiState.canContinue && !uiState.saving,
                onClick = { viewModel.save(onContinue) },
            )
        }
    }
}

@Composable
private fun ConsentCheckRow(
    checked: Boolean,
    title: String,
    body: String,
    onCheckedChange: (Boolean) -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .toggleable(
                value = checked,
                role = Role.Checkbox,
                onValueChange = onCheckedChange,
            ),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.Top,
    ) {
        Checkbox(checked = checked, onCheckedChange = onCheckedChange)
        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium, color = Ink, fontWeight = FontWeight.SemiBold)
            Text(body, style = MaterialTheme.typography.bodyMedium, color = MutedInk)
        }
    }
}

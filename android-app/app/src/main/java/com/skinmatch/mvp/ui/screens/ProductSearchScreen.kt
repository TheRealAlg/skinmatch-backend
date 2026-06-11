package com.skinmatch.mvp.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CloudOff
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import com.skinmatch.mvp.data.repository.ProductRepository
import com.skinmatch.mvp.domain.models.DataConfidence
import com.skinmatch.mvp.domain.models.ProductSearchResult
import com.skinmatch.mvp.domain.models.UiStatus
import com.skinmatch.mvp.ui.components.ConfidencePill
import com.skinmatch.mvp.ui.components.EmptyState
import com.skinmatch.mvp.ui.components.ErrorState
import com.skinmatch.mvp.ui.components.LoadingState
import com.skinmatch.mvp.ui.components.LowConfidenceState
import com.skinmatch.mvp.ui.components.MockProductBottle
import com.skinmatch.mvp.ui.components.SectionCard
import com.skinmatch.mvp.ui.components.StateCard
import com.skinmatch.mvp.ui.components.VerificationPill
import com.skinmatch.mvp.ui.theme.Ink
import com.skinmatch.mvp.ui.theme.MutedInk
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ProductSearchUiState(
    val query: String = "",
    val status: UiStatus = UiStatus.IDLE,
    val results: List<ProductSearchResult> = emptyList(),
    val errorMessage: String? = null,
)

class ProductSearchViewModel(
    private val productRepository: ProductRepository,
) : ViewModel() {
    private val mutableState = MutableStateFlow(ProductSearchUiState())
    val uiState: StateFlow<ProductSearchUiState> = mutableState.asStateFlow()
    private var searchJob: Job? = null

    fun onQueryChanged(query: String) {
        mutableState.value = mutableState.value.copy(query = query, errorMessage = null)
        searchJob?.cancel()
        if (query.isBlank()) {
            mutableState.value = ProductSearchUiState(query = query, status = UiStatus.IDLE)
            return
        }
        searchJob = viewModelScope.launch {
            mutableState.value = mutableState.value.copy(status = UiStatus.LOADING)
            runCatching { productRepository.search(query) }
                .onSuccess { results ->
                    mutableState.value = mutableState.value.copy(
                        status = if (results.isEmpty()) UiStatus.EMPTY else UiStatus.READY,
                        results = results,
                    )
                }
                .onFailure {
                    mutableState.value = mutableState.value.copy(
                        status = UiStatus.ERROR,
                        results = emptyList(),
                        errorMessage = "Mock katalog araması tamamlanamadı. 'hata' sorgusu bu durumu test eder.",
                    )
                }
        }
    }

    fun retry() {
        val query = mutableState.value.query
        onQueryChanged(query)
    }
}

@Composable
fun ProductSearchScreen(
    viewModel: ProductSearchViewModel,
    onProductClick: (String) -> Unit,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 18.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Text("Ara", style = MaterialTheme.typography.displayMedium, color = Ink)
        Text(
            "Türkiye pazarındaki mock ürünleri marka, kategori veya içerik adına göre arayın.",
            style = MaterialTheme.typography.bodyLarge,
            color = MutedInk,
        )
        OutlinedTextField(
            value = uiState.query,
            onValueChange = viewModel::onQueryChanged,
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            leadingIcon = { Icon(Icons.Rounded.Search, contentDescription = null) },
            label = { Text("Ürün, marka veya içerik") },
            supportingText = { Text("Örnek: serum, niacinamide, bariyer, asit") },
        )

        when (uiState.status) {
            UiStatus.IDLE -> StateCard(
                title = "Aramaya başlayın",
                body = "Mock katalog ürün kartlarında veri güveni, Türkiye ürün durumu ve kısa not gösterilir.",
                icon = Icons.Rounded.Search,
            )
            UiStatus.LOADING -> LoadingState("Mock ürünler aranıyor")
            UiStatus.EMPTY -> EmptyState("Bu sorgu için mock TR pazar ürününde eşleşme bulunamadı.")
            UiStatus.ERROR -> ErrorState(
                body = uiState.errorMessage ?: "Arama sırasında sorun oluştu.",
                onRetry = viewModel::retry,
            )
            else -> uiState.results.forEach { product ->
                ProductResultCard(product = product, onClick = { onProductClick(product.id) })
            }
        }
    }
}

@Composable
private fun ProductResultCard(
    product: ProductSearchResult,
    onClick: () -> Unit,
) {
    SectionCard(
        modifier = Modifier.clickable(onClick = onClick),
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            MockProductBottle(
                brand = product.brand,
                modifier = Modifier.size(width = 86.dp, height = 118.dp),
            )
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(7.dp),
            ) {
                Text(product.brand, style = MaterialTheme.typography.labelLarge, color = MutedInk)
                Text(
                    product.name,
                    style = MaterialTheme.typography.titleLarge,
                    color = Ink,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(product.category, style = MaterialTheme.typography.bodyMedium, color = MutedInk)
                VerificationPill(product.verificationStatus)
                ConfidencePill(product.dataConfidence)
            }
        }
        Text(product.note, style = MaterialTheme.typography.bodyMedium, color = MutedInk)
        if (product.dataConfidence == DataConfidence.LOW) {
            LowConfidenceState("Bu ürün kartı düşük güvenli mock veriden üretildi. Güçlü uyum yorumu yapılmaz.")
        }
    }
}

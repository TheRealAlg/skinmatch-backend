package com.skinmatch.mvp.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.Science
import androidx.compose.material.icons.rounded.Verified
import androidx.compose.material.icons.rounded.WarningAmber
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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
import com.skinmatch.mvp.domain.models.IngredientItem
import com.skinmatch.mvp.domain.models.ProductDetail
import com.skinmatch.mvp.domain.models.UiStatus
import com.skinmatch.mvp.ui.components.ConfidencePill
import com.skinmatch.mvp.ui.components.ErrorState
import com.skinmatch.mvp.ui.components.IngredientIcon
import com.skinmatch.mvp.ui.components.InlineStatusRow
import com.skinmatch.mvp.ui.components.LoadingState
import com.skinmatch.mvp.ui.components.LowConfidenceState
import com.skinmatch.mvp.ui.components.MockProductBottle
import com.skinmatch.mvp.ui.components.PremiumBackground
import com.skinmatch.mvp.ui.components.ScreenColumn
import com.skinmatch.mvp.ui.components.SectionCard
import com.skinmatch.mvp.ui.components.VerificationPill
import com.skinmatch.mvp.ui.theme.Ink
import com.skinmatch.mvp.ui.theme.MutedInk
import com.skinmatch.mvp.ui.theme.Sage
import com.skinmatch.mvp.ui.theme.Terracotta
import com.skinmatch.mvp.ui.theme.TerracottaDark
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ProductDetailUiState(
    val status: UiStatus = UiStatus.LOADING,
    val product: ProductDetail? = null,
    val errorMessage: String? = null,
)

class ProductDetailViewModel(
    private val productRepository: ProductRepository,
) : ViewModel() {
    private val mutableState = MutableStateFlow(ProductDetailUiState())
    val uiState: StateFlow<ProductDetailUiState> = mutableState.asStateFlow()

    fun load(productId: String) {
        viewModelScope.launch {
            mutableState.value = ProductDetailUiState(status = UiStatus.LOADING)
            runCatching { productRepository.detail(productId) }
                .onSuccess { product ->
                    mutableState.value = ProductDetailUiState(status = UiStatus.READY, product = product)
                }
                .onFailure {
                    mutableState.value = ProductDetailUiState(
                        status = UiStatus.ERROR,
                        errorMessage = "Ürün detayı mock katalogda bulunamadı.",
                    )
                }
        }
    }
}

@Composable
fun ProductDetailScreen(
    productId: String,
    viewModel: ProductDetailViewModel,
    onBack: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(productId) {
        viewModel.load(productId)
    }

    PremiumBackground {
        ScreenColumn {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Geri")
                }
                Text("SkinMatch", style = MaterialTheme.typography.headlineMedium, color = Terracotta)
                Icon(Icons.Rounded.Science, contentDescription = null, tint = TerracottaDark)
            }

            when (uiState.status) {
                UiStatus.LOADING -> LoadingState("Ürün detayı hazırlanıyor")
                UiStatus.ERROR -> ErrorState(
                    body = uiState.errorMessage ?: "Ürün detayı açılamadı.",
                    onRetry = { viewModel.load(productId) },
                )
                UiStatus.READY -> uiState.product?.let { ProductDetailContent(it) }
                else -> Unit
            }
        }
    }
}

@Composable
private fun ProductDetailContent(product: ProductDetail) {
    ProductHeader(product)
    if (product.dataConfidence == DataConfidence.LOW) {
        LowConfidenceState(product.confidenceNote)
    }

    SectionCard {
        InlineStatusRow(
            icon = Icons.Rounded.Verified,
            title = "Yerel ürün durumu",
            body = product.localStatusNote,
        )
        VerificationPill(product.verificationStatus)
        ConfidencePill(product.dataConfidence)
    }

    SectionCard {
        InlineStatusRow(
            icon = Icons.Rounded.Info,
            title = "Cilt uyumu hazırlığı",
            body = product.skinFitPlaceholder,
        )
    }

    BulletSection(
        title = "Neden uygun olabilir",
        items = product.whyThisMayFit,
        iconTint = Sage,
        icon = Icons.Rounded.CheckCircle,
    )

    BulletSection(
        title = "Dikkat noktaları",
        items = product.watchouts,
        iconTint = TerracottaDark,
        icon = Icons.Rounded.WarningAmber,
    )

    BulletSection(
        title = "İçerik uyumluluğu",
        items = product.compatibilityNotes,
        iconTint = Sage,
        icon = Icons.Rounded.Science,
    )

    SectionCard {
        Text("Ham içerik metni", style = MaterialTheme.typography.titleLarge, color = Ink)
        Text(product.rawIngredientText, style = MaterialTheme.typography.bodyMedium, color = MutedInk)
    }

    SectionCard {
        Text("Normalize içerikler", style = MaterialTheme.typography.titleLarge, color = Ink)
        product.normalizedIngredients.forEach { ingredient ->
            IngredientRow(ingredient)
        }
    }

    SectionCard {
        Text("Veri güveni notu", style = MaterialTheme.typography.titleLarge, color = Ink)
        Text(product.confidenceNote, style = MaterialTheme.typography.bodyMedium, color = MutedInk)
    }
}

@Composable
private fun ProductHeader(product: ProductDetail) {
    SectionCard {
        Row(
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            MockProductBottle(
                brand = product.brand,
                modifier = Modifier.size(width = 130.dp, height = 174.dp),
            )
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text(product.brand, style = MaterialTheme.typography.labelLarge, color = Terracotta)
                Text(
                    product.marketProductName,
                    style = MaterialTheme.typography.displayMedium,
                    color = Ink,
                    maxLines = 3,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(product.category, style = MaterialTheme.typography.bodyLarge, color = MutedInk)
                Text("Doku: ${product.texture}", style = MaterialTheme.typography.bodyMedium, color = MutedInk)
            }
        }
    }
}

@Composable
private fun BulletSection(
    title: String,
    items: List<String>,
    iconTint: androidx.compose.ui.graphics.Color,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
) {
    SectionCard {
        Text(title, style = MaterialTheme.typography.titleLarge, color = Ink)
        items.forEach { item ->
            Row(
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.Top,
            ) {
                Icon(icon, contentDescription = null, tint = iconTint, modifier = Modifier.size(20.dp))
                Text(item, style = MaterialTheme.typography.bodyMedium, color = MutedInk)
            }
        }
    }
}

@Composable
private fun IngredientRow(ingredient: IngredientItem) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.Top,
    ) {
        IngredientIcon()
        Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(
                "${ingredient.displayName} (${ingredient.inciName})",
                style = MaterialTheme.typography.titleMedium,
                color = Ink,
                fontWeight = FontWeight.SemiBold,
            )
            Text(ingredient.function, style = MaterialTheme.typography.bodyMedium, color = MutedInk)
            Text(ingredient.note, style = MaterialTheme.typography.bodyMedium, color = MutedInk)
            ConfidencePill(ingredient.confidence)
        }
    }
}

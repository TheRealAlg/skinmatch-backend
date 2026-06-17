package com.skinmatch.mvp.ui.components

import android.graphics.BitmapFactory
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.skinmatch.mvp.ui.theme.AmberLight
import com.skinmatch.mvp.ui.theme.CreamDeep
import com.skinmatch.mvp.ui.theme.Ink
import com.skinmatch.mvp.ui.theme.MutedInk
import com.skinmatch.mvp.ui.theme.OutlineWarm
import com.skinmatch.mvp.ui.theme.SageLight
import com.skinmatch.mvp.ui.theme.Surface
import com.skinmatch.mvp.ui.theme.TealMist
import com.skinmatch.mvp.ui.theme.TerracottaDark
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale

@Composable
fun ProductVisual(
    imageUrl: String?,
    category: String,
    productName: String,
    modifier: Modifier = Modifier,
) {
    var image by remember(imageUrl) { mutableStateOf<androidx.compose.ui.graphics.ImageBitmap?>(null) }
    val cleanUrl = imageUrl?.takeIf { it.isNotBlank() }

    LaunchedEffect(cleanUrl) {
        image = null
        if (cleanUrl == null) return@LaunchedEffect

        runCatching {
            withContext(Dispatchers.IO) { loadProductBitmap(cleanUrl) }
        }.onSuccess { loaded ->
            image = loaded
        }
    }

    Box(
        modifier = modifier
            .aspectRatio(0.72f)
            .clip(RoundedCornerShape(8.dp))
            .background(Surface)
            .border(1.dp, OutlineWarm, RoundedCornerShape(8.dp)),
        contentAlignment = Alignment.Center,
    ) {
        val loadedImage = image
        if (loadedImage != null) {
            Image(
                bitmap = loadedImage,
                contentDescription = "Ürün görseli: $productName",
                modifier = Modifier
                    .fillMaxSize()
                    .padding(6.dp),
                contentScale = ContentScale.Fit,
            )
        } else {
            ProductFallbackVisual(category = category)
        }
    }
}

private fun loadProductBitmap(url: String): androidx.compose.ui.graphics.ImageBitmap? {
    val connection = (URL(url).openConnection() as HttpURLConnection).apply {
        connectTimeout = 3_000
        readTimeout = 4_000
        instanceFollowRedirects = true
    }
    return connection.inputStream.use { input ->
        BitmapFactory.decodeStream(input)?.asImageBitmap()
    }
}

@Composable
private fun ProductFallbackVisual(
    category: String,
) {
    val fallback = remember(category) { ProductFallback.from(category) }
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            drawRoundRect(
                brush = Brush.verticalGradient(listOf(fallback.background, Surface)),
                topLeft = Offset.Zero,
                size = size,
                cornerRadius = CornerRadius(20f, 20f),
            )

            when (fallback.kind) {
                ProductFallbackKind.Serum -> drawSerumFallback(fallback.accent)
                ProductFallbackKind.Cleanser -> drawTubeFallback(fallback.accent, tall = true)
                ProductFallbackKind.Sunscreen -> drawSunscreenFallback(fallback.accent)
                ProductFallbackKind.Moisturizer -> drawJarFallback(fallback.accent)
                ProductFallbackKind.Toner -> drawTonerFallback(fallback.accent)
                ProductFallbackKind.Unknown -> drawTubeFallback(fallback.accent, tall = false)
            }
        }

        Text(
            text = fallback.label,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(horizontal = 8.dp, vertical = 10.dp),
            style = MaterialTheme.typography.labelMedium,
            color = Ink,
            fontWeight = FontWeight.SemiBold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            textAlign = TextAlign.Center,
        )

    }
}

private enum class ProductFallbackKind {
    Serum,
    Cleanser,
    Sunscreen,
    Moisturizer,
    Toner,
    Unknown,
}

private data class ProductFallback(
    val kind: ProductFallbackKind,
    val label: String,
    val background: Color,
    val accent: Color,
) {
    companion object {
        fun from(category: String): ProductFallback {
            val normalized = category.lowercase(Locale.ROOT)
            return when {
                "serum" in normalized -> ProductFallback(ProductFallbackKind.Serum, "Serum", AmberLight, Color(0xFF9A613B))
                "temiz" in normalized || "cleanser" in normalized -> ProductFallback(ProductFallbackKind.Cleanser, "Temizleyici", CreamDeep, TerracottaDark)
                "spf" in normalized || "sunscreen" in normalized || "güneş" in normalized || "gunes" in normalized -> ProductFallback(ProductFallbackKind.Sunscreen, "Güneş koruyucu", AmberLight, Color(0xFFC8894F))
                "nem" in normalized || "moistur" in normalized || "cream" in normalized || "krem" in normalized -> ProductFallback(ProductFallbackKind.Moisturizer, "Nemlendirici", SageLight, Color(0xFF7B8A71))
                "toner" in normalized || "tonik" in normalized -> ProductFallback(ProductFallbackKind.Toner, "Tonik", TealMist, Color(0xFF6B8F8A))
                else -> ProductFallback(ProductFallbackKind.Unknown, category.ifBlank { "Ürün" }, CreamDeep, TerracottaDark)
            }
        }
    }
}

private fun androidx.compose.ui.graphics.drawscope.DrawScope.drawSerumFallback(accent: Color) {
    val bottleWidth = size.width * 0.34f
    val bottleHeight = size.height * 0.48f
    val left = (size.width - bottleWidth) / 2f
    val top = size.height * 0.31f
    drawRoundRect(
        color = accent,
        topLeft = Offset(left, top),
        size = Size(bottleWidth, bottleHeight),
        cornerRadius = CornerRadius(14f, 14f),
    )
    drawRoundRect(
        color = Surface.copy(alpha = 0.9f),
        topLeft = Offset(left + bottleWidth * 0.13f, top + bottleHeight * 0.35f),
        size = Size(bottleWidth * 0.74f, bottleHeight * 0.32f),
        cornerRadius = CornerRadius(8f, 8f),
    )
    drawRoundRect(
        color = Color(0xFFE6D7CC),
        topLeft = Offset(left + bottleWidth * 0.2f, top - bottleHeight * 0.16f),
        size = Size(bottleWidth * 0.6f, bottleHeight * 0.15f),
        cornerRadius = CornerRadius(9f, 9f),
    )
    drawRoundRect(
        color = Color(0xFFD4B4A0),
        topLeft = Offset(left + bottleWidth * 0.36f, top - bottleHeight * 0.34f),
        size = Size(bottleWidth * 0.28f, bottleHeight * 0.2f),
        cornerRadius = CornerRadius(5f, 5f),
    )
}

private fun androidx.compose.ui.graphics.drawscope.DrawScope.drawTubeFallback(
    accent: Color,
    tall: Boolean,
) {
    val tubeWidth = size.width * if (tall) 0.46f else 0.4f
    val tubeHeight = size.height * if (tall) 0.62f else 0.52f
    val left = (size.width - tubeWidth) / 2f
    val top = size.height * 0.21f
    drawRoundRect(
        brush = Brush.verticalGradient(listOf(Surface, Color(0xFFEEDFD0))),
        topLeft = Offset(left, top),
        size = Size(tubeWidth, tubeHeight),
        cornerRadius = CornerRadius(26f, 26f),
    )
    drawRoundRect(
        color = accent.copy(alpha = 0.72f),
        topLeft = Offset(left, top + tubeHeight * 0.76f),
        size = Size(tubeWidth, tubeHeight * 0.18f),
        cornerRadius = CornerRadius(16f, 16f),
    )
    drawRoundRect(
        color = accent.copy(alpha = 0.3f),
        topLeft = Offset(left + tubeWidth * 0.2f, top + tubeHeight * 0.28f),
        size = Size(tubeWidth * 0.6f, 8f),
        cornerRadius = CornerRadius(8f, 8f),
    )
}

private fun androidx.compose.ui.graphics.drawscope.DrawScope.drawSunscreenFallback(accent: Color) {
    drawTubeFallback(accent, tall = true)
    drawCircle(
        color = Color(0xFFFFF6D8),
        radius = size.minDimension * 0.12f,
        center = Offset(size.width * 0.5f, size.height * 0.43f),
    )
    drawCircle(
        color = accent.copy(alpha = 0.55f),
        radius = size.minDimension * 0.075f,
        center = Offset(size.width * 0.5f, size.height * 0.43f),
    )
}

private fun androidx.compose.ui.graphics.drawscope.DrawScope.drawJarFallback(accent: Color) {
    val jarWidth = size.width * 0.56f
    val jarHeight = size.height * 0.32f
    val left = (size.width - jarWidth) / 2f
    val top = size.height * 0.45f
    drawRoundRect(
        color = accent.copy(alpha = 0.85f),
        topLeft = Offset(left, top - jarHeight * 0.22f),
        size = Size(jarWidth, jarHeight * 0.22f),
        cornerRadius = CornerRadius(16f, 16f),
    )
    drawRoundRect(
        brush = Brush.verticalGradient(listOf(Surface, Color(0xFFE8E2D9))),
        topLeft = Offset(left + jarWidth * 0.04f, top),
        size = Size(jarWidth * 0.92f, jarHeight),
        cornerRadius = CornerRadius(20f, 20f),
    )
}

private fun androidx.compose.ui.graphics.drawscope.DrawScope.drawTonerFallback(accent: Color) {
    val bottleWidth = size.width * 0.36f
    val bottleHeight = size.height * 0.58f
    val left = (size.width - bottleWidth) / 2f
    val top = size.height * 0.24f
    drawRoundRect(
        brush = Brush.verticalGradient(listOf(Color.White.copy(alpha = 0.85f), accent.copy(alpha = 0.24f))),
        topLeft = Offset(left, top),
        size = Size(bottleWidth, bottleHeight),
        cornerRadius = CornerRadius(18f, 18f),
    )
    drawRoundRect(
        color = accent.copy(alpha = 0.68f),
        topLeft = Offset(left + bottleWidth * 0.18f, top - bottleHeight * 0.12f),
        size = Size(bottleWidth * 0.64f, bottleHeight * 0.12f),
        cornerRadius = CornerRadius(8f, 8f),
    )
    drawRoundRect(
        color = Surface.copy(alpha = 0.9f),
        topLeft = Offset(left + bottleWidth * 0.12f, top + bottleHeight * 0.5f),
        size = Size(bottleWidth * 0.76f, bottleHeight * 0.2f),
        cornerRadius = CornerRadius(9f, 9f),
    )
}

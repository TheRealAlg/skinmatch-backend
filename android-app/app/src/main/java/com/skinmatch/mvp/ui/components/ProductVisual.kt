package com.skinmatch.mvp.ui.components

import android.graphics.BitmapFactory
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import com.skinmatch.mvp.ui.assets.productFallbackDrawableForCategory
import com.skinmatch.mvp.ui.theme.OutlineWarm
import com.skinmatch.mvp.ui.theme.Surface
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL

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
                contentDescription = "Product image: $productName",
                modifier = Modifier
                    .fillMaxSize()
                    .padding(6.dp),
                contentScale = ContentScale.Fit,
            )
        } else {
            ProductFallbackVisual(category = category, productName = productName)
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
    productName: String,
) {
    Image(
        painter = painterResource(productFallbackDrawableForCategory(category)),
        contentDescription = "Product fallback image: $productName",
        modifier = Modifier
            .fillMaxSize()
            .padding(4.dp),
        contentScale = ContentScale.Fit,
    )
}

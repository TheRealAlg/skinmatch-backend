package com.skinmatch.mvp.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.FactCheck
import androidx.compose.material.icons.rounded.Shield
import androidx.compose.material.icons.rounded.Spa
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.skinmatch.mvp.ui.components.BrandMark
import com.skinmatch.mvp.ui.components.MockProductBottle
import com.skinmatch.mvp.ui.components.PremiumBackground
import com.skinmatch.mvp.ui.components.PrimaryActionButton
import com.skinmatch.mvp.ui.components.ScreenColumn
import com.skinmatch.mvp.ui.components.SecondaryActionButton
import com.skinmatch.mvp.ui.components.SectionCard
import com.skinmatch.mvp.ui.theme.CreamDeep
import com.skinmatch.mvp.ui.theme.Ink
import com.skinmatch.mvp.ui.theme.MutedInk
import com.skinmatch.mvp.ui.theme.Sage
import com.skinmatch.mvp.ui.theme.TerracottaDark

@Composable
fun WelcomeScreen(
    onBuildProfile: () -> Unit,
    onBrowseProducts: () -> Unit,
) {
    PremiumBackground {
        ScreenColumn {
            BrandMark()
            Text(
                text = "Cilt bakım ürünlerini cildinize göre değerlendirin",
                style = MaterialTheme.typography.displayMedium,
                color = Ink,
            )
            Text(
                text = "Türkiye pazarındaki ürünleri cilt profiliniz, içerik uyumu ve veri güveniyle birlikte keşfedin.",
                style = MaterialTheme.typography.bodyLarge,
                color = MutedInk,
            )

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(250.dp),
                contentAlignment = Alignment.Center,
            ) {
                MockProductBottle(
                    brand = "Lumina",
                    modifier = Modifier.size(width = 172.dp, height = 230.dp),
                )
            }

            SectionCard {
                TrustRow(
                    icon = Icons.Rounded.Spa,
                    title = "Profil odaklı keşif",
                    body = "Cilt tipi, hassasiyet, gözenek ve hedef bilgileriyle başlar.",
                )
                TrustRow(
                    icon = Icons.AutoMirrored.Rounded.FactCheck,
                    title = "Yerel veri güveni",
                    body = "Ürün verisi TR pazarı, ÜTS bağlamı ve içerik doğrulamasıyla ayrılır.",
                )
                TrustRow(
                    icon = Icons.Rounded.Shield,
                    title = "Temkinli dil",
                    body = "Tanı, tedavi veya kesin sonuç iddiası yerine uyumluluk sinyalleri gösterilir.",
                )
            }

            Spacer(modifier = Modifier.weight(1f, fill = false))
            PrimaryActionButton(text = "Cilt profilimi oluştur", onClick = onBuildProfile)
            SecondaryActionButton(text = "Ürünleri keşfet", onClick = onBrowseProducts)
        }
    }
}

@Composable
private fun TrustRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    body: String,
) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.Top,
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(CircleShape)
                .padding(2.dp),
            contentAlignment = Alignment.Center,
        ) {
            Icon(icon, contentDescription = null, tint = Sage)
        }
        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium, color = TerracottaDark, fontWeight = FontWeight.SemiBold)
            Text(body, style = MaterialTheme.typography.bodyMedium, color = MutedInk)
        }
    }
}

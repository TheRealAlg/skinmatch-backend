package com.skinmatch.mvp.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.background
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
import com.skinmatch.mvp.ui.components.PremiumBackground
import com.skinmatch.mvp.ui.components.PrimaryActionButton
import com.skinmatch.mvp.ui.components.ProductStillLifeHero
import com.skinmatch.mvp.ui.components.ScreenColumn
import com.skinmatch.mvp.ui.components.SecondaryActionButton
import com.skinmatch.mvp.ui.components.SectionCard
import com.skinmatch.mvp.ui.theme.CreamDeep
import com.skinmatch.mvp.ui.theme.Ink
import com.skinmatch.mvp.ui.theme.MutedInk
import com.skinmatch.mvp.ui.theme.Sage
import com.skinmatch.mvp.ui.theme.Surface
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
                text = "Türkiye’de satılan ürünleri; cilt profiliniz, içerik geçmişiniz ve veri güveniyle birlikte okuyun.",
                style = MaterialTheme.typography.bodyLarge,
                color = MutedInk,
            )

            ProductStillLifeHero()

            SectionCard {
                TrustRow(
                    icon = Icons.Rounded.Spa,
                    title = "Profil odaklı keşif",
                    body = "Cilt tipi, hassasiyet, gözenek, siyah nokta eğilimi ve içerik geçmişi birlikte değerlendirilir.",
                )
                WelcomeSignalStrip()
            }

            Spacer(modifier = Modifier.weight(1f, fill = false))
            PrimaryActionButton(text = "Cilt profilimi oluştur", onClick = onBuildProfile)
            SecondaryActionButton(text = "Misafir olarak incele", onClick = onBrowseProducts)
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun WelcomeSignalStrip() {
    FlowRow(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        WelcomeSignal("TR katalog", Icons.AutoMirrored.Rounded.FactCheck)
        WelcomeSignal("Veri güveni", Icons.Rounded.Shield)
        WelcomeSignal("not_scored", Icons.Rounded.Spa)
    }
}

@Composable
private fun WelcomeSignal(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
) {
    Row(
        modifier = Modifier
            .clip(CircleShape)
            .background(Surface.copy(alpha = 0.86f))
            .padding(horizontal = 10.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(icon, contentDescription = null, tint = Sage, modifier = Modifier.size(16.dp))
        Text(label, style = MaterialTheme.typography.labelMedium, color = TerracottaDark)
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
                .background(CreamDeep)
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

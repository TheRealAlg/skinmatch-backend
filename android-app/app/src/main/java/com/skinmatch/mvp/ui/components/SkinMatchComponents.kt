package com.skinmatch.mvp.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowForward
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.CloudOff
import androidx.compose.material.icons.rounded.ErrorOutline
import androidx.compose.material.icons.rounded.HourglassTop
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.Science
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.Verified
import androidx.compose.material3.AssistChip
import androidx.compose.material3.AssistChipDefaults
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.skinmatch.mvp.domain.models.DataConfidence
import com.skinmatch.mvp.domain.models.VerificationStatus
import com.skinmatch.mvp.ui.theme.Amber
import com.skinmatch.mvp.ui.theme.AmberLight
import com.skinmatch.mvp.ui.theme.Cream
import com.skinmatch.mvp.ui.theme.CreamDeep
import com.skinmatch.mvp.ui.theme.Ink
import com.skinmatch.mvp.ui.theme.MutedInk
import com.skinmatch.mvp.ui.theme.OutlineWarm
import com.skinmatch.mvp.ui.theme.Sage
import com.skinmatch.mvp.ui.theme.SageLight
import com.skinmatch.mvp.ui.theme.Surface
import com.skinmatch.mvp.ui.theme.Terracotta
import com.skinmatch.mvp.ui.theme.TerracottaDark
import com.skinmatch.mvp.ui.theme.TerracottaLight
import com.skinmatch.mvp.ui.theme.WarningSoft

@Composable
fun PremiumBackground(content: @Composable () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Cream),
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val path = Path().apply {
                moveTo(size.width * 0.62f, 0f)
                cubicTo(
                    size.width * 0.93f,
                    size.height * 0.08f,
                    size.width * 0.72f,
                    size.height * 0.18f,
                    size.width,
                    size.height * 0.28f,
                )
            }
            drawPath(
                path = path,
                color = CreamDeep.copy(alpha = 0.65f),
                style = Stroke(width = 24f, cap = StrokeCap.Round),
            )
            drawCircle(
                color = TerracottaLight.copy(alpha = 0.16f),
                radius = size.width * 0.35f,
                center = Offset(size.width * 0.92f, size.height * 0.06f),
            )
        }
        content()
    }
}

@Composable
fun ScreenColumn(
    modifier: Modifier = Modifier,
    contentPadding: PaddingValues = PaddingValues(horizontal = 20.dp, vertical = 18.dp),
    content: @Composable ColumnScope.() -> Unit,
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .statusBarsPadding()
            .navigationBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(contentPadding),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        content = content,
    )
}

@Composable
fun BrandMark(modifier: Modifier = Modifier) {
    Text(
        text = "SkinMatch",
        modifier = modifier,
        style = MaterialTheme.typography.headlineMedium,
        color = Terracotta,
    )
}

@Composable
fun SectionCard(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = Surface.copy(alpha = 0.94f)),
        border = androidx.compose.foundation.BorderStroke(1.dp, OutlineWarm),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            content = content,
        )
    }
}

@Composable
fun PrimaryActionButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    Button(
        onClick = onClick,
        modifier = modifier
            .fillMaxWidth()
            .height(54.dp),
        enabled = enabled,
        shape = RoundedCornerShape(12.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = Terracotta,
            contentColor = androidx.compose.ui.graphics.Color.White,
            disabledContainerColor = TerracottaLight,
            disabledContentColor = Surface,
        ),
    ) {
        Text(text = text, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Spacer(modifier = Modifier.width(10.dp))
        Icon(Icons.AutoMirrored.Rounded.ArrowForward, contentDescription = null)
    }
}

@Composable
fun SecondaryActionButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    OutlinedButton(
        onClick = onClick,
        modifier = modifier
            .fillMaxWidth()
            .height(50.dp),
        enabled = enabled,
        shape = RoundedCornerShape(12.dp),
        colors = ButtonDefaults.outlinedButtonColors(
            contentColor = TerracottaDark,
        ),
        border = BorderStroke(1.dp, OutlineWarm),
    ) {
        Text(text = text, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SelectablePill(
    text: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        modifier = modifier,
        label = {
            Text(text = text, maxLines = 1, overflow = TextOverflow.Ellipsis)
        },
        leadingIcon = if (selected) {
            {
                Icon(
                    Icons.Rounded.Check,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp),
                )
            }
        } else {
            null
        },
        shape = RoundedCornerShape(18.dp),
        colors = FilterChipDefaults.filterChipColors(
            containerColor = Surface,
            labelColor = Ink,
            selectedContainerColor = Terracotta,
            selectedLabelColor = androidx.compose.ui.graphics.Color.White,
            selectedLeadingIconColor = androidx.compose.ui.graphics.Color.White,
        ),
        border = FilterChipDefaults.filterChipBorder(
            enabled = true,
            selected = selected,
            borderColor = OutlineWarm,
            selectedBorderColor = Terracotta,
        ),
    )
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun OptionFlow(content: @Composable () -> Unit) {
    FlowRow(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        content()
    }
}

@Composable
fun StateCard(
    title: String,
    body: String,
    modifier: Modifier = Modifier,
    icon: ImageVector = Icons.Rounded.Info,
    actionLabel: String? = null,
    onAction: (() -> Unit)? = null,
) {
    SectionCard(modifier = modifier) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.Top,
        ) {
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .clip(CircleShape)
                    .background(TerracottaLight.copy(alpha = 0.45f)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, contentDescription = null, tint = TerracottaDark)
            }
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(title, style = MaterialTheme.typography.titleMedium, color = Ink)
                Text(body, style = MaterialTheme.typography.bodyMedium, color = MutedInk)
            }
        }
        if (actionLabel != null && onAction != null) {
            SecondaryActionButton(text = actionLabel, onClick = onAction)
        }
    }
}

@Composable
fun LoadingState(title: String = "Yükleniyor") {
    SectionCard {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            CircularProgressIndicator(
                modifier = Modifier.size(24.dp),
                color = Terracotta,
                strokeWidth = 2.dp,
            )
            Text(title, style = MaterialTheme.typography.bodyLarge, color = Ink)
        }
    }
}

@Composable
fun EmptyState(body: String, modifier: Modifier = Modifier) {
    StateCard(
        title = "Henüz veri yok",
        body = body,
        modifier = modifier,
        icon = Icons.Rounded.Search,
    )
}

@Composable
fun ErrorState(body: String, modifier: Modifier = Modifier, onRetry: (() -> Unit)? = null) {
    StateCard(
        title = "Bir sorun oluştu",
        body = body,
        modifier = modifier,
        icon = Icons.Rounded.ErrorOutline,
        actionLabel = if (onRetry != null) "Tekrar dene" else null,
        onAction = onRetry,
    )
}

@Composable
fun ConsentBlockedState(onOpenConsent: () -> Unit) {
    StateCard(
        title = "Onay gerekli",
        body = "Cilt profili, tetikleyiciler ve hassasiyet bilgileri hassas veri kabul edilir. Kaydetmeden önce aktif KVKK ve profil işleme onayı gerekir.",
        icon = Icons.Rounded.Lock,
        actionLabel = "Onay ekranına git",
        onAction = onOpenConsent,
    )
}

@Composable
fun LowConfidenceState(note: String) {
    StateCard(
        title = "Veri güveni düşük",
        body = note,
        icon = Icons.Rounded.CloudOff,
    )
}

@Composable
fun ConfidencePill(confidence: DataConfidence) {
    val colors = when (confidence) {
        DataConfidence.HIGH -> SageLight to Sage
        DataConfidence.MEDIUM -> AmberLight to Amber
        DataConfidence.LOW -> WarningSoft to TerracottaDark
        DataConfidence.UNKNOWN -> WarningSoft to TerracottaDark
    }
    AssistChip(
        onClick = {},
        label = { Text("Veri güveni: ${confidence.label}") },
        leadingIcon = {
            Icon(
                if (confidence == DataConfidence.HIGH) Icons.Rounded.Verified else Icons.Rounded.HourglassTop,
                contentDescription = null,
                modifier = Modifier.size(16.dp),
            )
        },
        colors = AssistChipDefaults.assistChipColors(
            containerColor = colors.first,
            labelColor = colors.second,
            leadingIconContentColor = colors.second,
        ),
        border = null,
    )
}

@Composable
fun VerificationPill(status: VerificationStatus) {
    val colors = when (status) {
        VerificationStatus.UTS_CHECKED,
        VerificationStatus.LABEL_REVIEWED,
        VerificationStatus.RETAILER_SOURCED -> SageLight to Sage
        VerificationStatus.USER_SUBMITTED -> AmberLight to Amber
        VerificationStatus.UNVERIFIED,
        VerificationStatus.UNKNOWN -> WarningSoft to TerracottaDark
    }
    AssistChip(
        onClick = {},
        label = { Text(status.label) },
        leadingIcon = {
            Icon(
                Icons.Rounded.Verified,
                contentDescription = null,
                modifier = Modifier.size(16.dp),
            )
        },
        colors = AssistChipDefaults.assistChipColors(
            containerColor = colors.first,
            labelColor = colors.second,
            leadingIconContentColor = colors.second,
        ),
        border = null,
    )
}

@Composable
fun ProductBottle(
    brand: String,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .aspectRatio(0.72f)
            .clip(RoundedCornerShape(8.dp))
            .background(
                Brush.verticalGradient(
                    listOf(Surface, CreamDeep),
                ),
            )
            .border(1.dp, OutlineWarm, RoundedCornerShape(8.dp)),
        contentAlignment = Alignment.Center,
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val bottleWidth = size.width * 0.34f
            val bottleHeight = size.height * 0.58f
            val left = (size.width - bottleWidth) / 2f
            val top = size.height * 0.24f
            drawRoundRect(
                color = androidx.compose.ui.graphics.Color(0xFF9A613B),
                topLeft = Offset(left, top),
                size = Size(bottleWidth, bottleHeight),
                cornerRadius = CornerRadius(14f, 14f),
            )
            drawRoundRect(
                color = Surface.copy(alpha = 0.92f),
                topLeft = Offset(left + bottleWidth * 0.12f, top + bottleHeight * 0.35f),
                size = Size(bottleWidth * 0.76f, bottleHeight * 0.36f),
                cornerRadius = CornerRadius(8f, 8f),
            )
            drawRoundRect(
                color = androidx.compose.ui.graphics.Color(0xFFE9D6C8),
                topLeft = Offset(left + bottleWidth * 0.24f, top - bottleHeight * 0.12f),
                size = Size(bottleWidth * 0.52f, bottleHeight * 0.16f),
                cornerRadius = CornerRadius(10f, 10f),
            )
        }
        Text(
            text = brand.uppercase(),
            modifier = Modifier
                .align(Alignment.Center)
                .padding(top = 42.dp),
            style = MaterialTheme.typography.labelLarge,
            color = TerracottaDark,
            fontWeight = FontWeight.SemiBold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

@Composable
fun InlineStatusRow(
    icon: ImageVector,
    title: String,
    body: String,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.Top,
    ) {
        Box(
            modifier = Modifier
                .size(34.dp)
                .clip(CircleShape)
                .background(CreamDeep),
            contentAlignment = Alignment.Center,
        ) {
            Icon(icon, contentDescription = null, tint = TerracottaDark, modifier = Modifier.size(18.dp))
        }
        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium, color = Ink)
            Text(body, style = MaterialTheme.typography.bodyMedium, color = MutedInk)
        }
    }
}

@Composable
fun IngredientIcon() {
    Box(
        modifier = Modifier
            .size(34.dp)
            .clip(CircleShape)
            .background(SageLight),
        contentAlignment = Alignment.Center,
    ) {
        Icon(Icons.Rounded.Science, contentDescription = null, tint = Sage, modifier = Modifier.size(18.dp))
    }
}

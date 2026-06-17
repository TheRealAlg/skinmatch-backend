package com.skinmatch.mvp.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.skinmatch.mvp.domain.models.SkinProfile
import com.skinmatch.mvp.ui.theme.Amber
import com.skinmatch.mvp.ui.theme.Cream
import com.skinmatch.mvp.ui.theme.Ink
import com.skinmatch.mvp.ui.theme.OutlineWarm
import com.skinmatch.mvp.ui.theme.Petal
import com.skinmatch.mvp.ui.theme.Sage
import com.skinmatch.mvp.ui.theme.Surface
import com.skinmatch.mvp.ui.theme.TealMist
import com.skinmatch.mvp.ui.theme.Terracotta

data class SkinProfileAvatarSignals(
    val tZoneOiliness: Boolean,
    val allOverOiliness: Boolean,
    val cheekDryness: Boolean,
    val allOverDryness: Boolean,
    val sensitivityOrRedness: Boolean,
    val poreOrBlackheadFocus: Boolean,
    val breakoutFocus: Boolean,
    val dehydrationOrBarrierFocus: Boolean,
    val pigmentationOrTextureFocus: Boolean,
) {
    companion object {
        fun from(profile: SkinProfile): SkinProfileAvatarSignals {
            return SkinProfileAvatarSignals(
                tZoneOiliness = profile.oilinessPattern == "t_zone" || profile.oilinessPattern == "all_over",
                allOverOiliness = profile.oilinessPattern == "all_over",
                cheekDryness = profile.drynessPattern == "cheeks" || profile.drynessPattern == "all_over",
                allOverDryness = profile.drynessPattern == "all_over",
                sensitivityOrRedness = profile.sensitivityLevel.isMeaningfulLevel() ||
                    profile.rednessTendency.isMeaningfulLevel(),
                poreOrBlackheadFocus = profile.poresLevel.isMeaningfulLevel() ||
                    profile.blackheadTendency.isMeaningfulTendency() ||
                    profile.cloggedPoreTendency.isMeaningfulTendency(),
                breakoutFocus = profile.acneProneBehavior.isMeaningfulTendency(),
                dehydrationOrBarrierFocus = profile.dehydrationLevel.isMeaningfulLevel() ||
                    profile.barrierDamageLevel.isMeaningfulLevel(),
                pigmentationOrTextureFocus = profile.hyperpigmentationLevel.isMeaningfulLevel() ||
                    profile.textureConcernLevel.isMeaningfulLevel(),
            )
        }
    }
}

@Composable
fun SkinProfileAvatar(
    profile: SkinProfile,
    modifier: Modifier = Modifier,
    contentDescription: String = "Skin profile visual summary",
) {
    SkinProfileAvatar(
        signals = SkinProfileAvatarSignals.from(profile),
        modifier = modifier,
        contentDescription = contentDescription,
    )
}

@Composable
fun SkinProfileAvatar(
    signals: SkinProfileAvatarSignals,
    modifier: Modifier = Modifier,
    contentDescription: String = "Skin profile visual summary",
) {
    Box(
        modifier = modifier
            .aspectRatio(1f)
            .clip(RoundedCornerShape(8.dp))
            .background(Surface)
            .semantics { this.contentDescription = contentDescription },
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val w = size.width
            val h = size.height
            val stroke = Stroke(width = w * 0.012f)
            val softStroke = Stroke(width = w * 0.009f)

            drawCircle(
                color = Cream,
                radius = w * 0.43f,
                center = Offset(w * 0.5f, h * 0.52f),
            )

            if (signals.allOverDryness) {
                drawOval(
                    color = Petal.copy(alpha = 0.18f),
                    topLeft = Offset(w * 0.25f, h * 0.2f),
                    size = Size(w * 0.5f, h * 0.58f),
                )
            }

            if (signals.allOverOiliness) {
                drawOval(
                    color = Sage.copy(alpha = 0.1f),
                    topLeft = Offset(w * 0.28f, h * 0.24f),
                    size = Size(w * 0.44f, h * 0.5f),
                )
            }

            if (signals.tZoneOiliness) {
                drawRoundRect(
                    color = Sage.copy(alpha = 0.22f),
                    topLeft = Offset(w * 0.43f, h * 0.23f),
                    size = Size(w * 0.14f, h * 0.4f),
                    cornerRadius = androidx.compose.ui.geometry.CornerRadius(w * 0.08f),
                )
                drawRoundRect(
                    color = Sage.copy(alpha = 0.16f),
                    topLeft = Offset(w * 0.33f, h * 0.23f),
                    size = Size(w * 0.34f, h * 0.11f),
                    cornerRadius = androidx.compose.ui.geometry.CornerRadius(w * 0.08f),
                )
            }

            if (signals.cheekDryness) {
                drawOval(
                    color = Amber.copy(alpha = 0.18f),
                    topLeft = Offset(w * 0.23f, h * 0.48f),
                    size = Size(w * 0.18f, h * 0.13f),
                )
                drawOval(
                    color = Amber.copy(alpha = 0.18f),
                    topLeft = Offset(w * 0.59f, h * 0.48f),
                    size = Size(w * 0.18f, h * 0.13f),
                )
            }

            if (signals.sensitivityOrRedness) {
                drawOval(
                    color = Terracotta.copy(alpha = 0.14f),
                    topLeft = Offset(w * 0.22f, h * 0.42f),
                    size = Size(w * 0.2f, h * 0.16f),
                )
                drawOval(
                    color = Terracotta.copy(alpha = 0.14f),
                    topLeft = Offset(w * 0.58f, h * 0.42f),
                    size = Size(w * 0.2f, h * 0.16f),
                )
            }

            if (signals.dehydrationOrBarrierFocus) {
                drawOval(
                    color = TealMist.copy(alpha = 0.62f),
                    topLeft = Offset(w * 0.36f, h * 0.62f),
                    size = Size(w * 0.28f, h * 0.12f),
                )
            }

            val face = Path().apply {
                moveTo(w * 0.29f, h * 0.3f)
                cubicTo(w * 0.22f, h * 0.48f, w * 0.29f, h * 0.72f, w * 0.5f, h * 0.79f)
                cubicTo(w * 0.71f, h * 0.72f, w * 0.78f, h * 0.48f, w * 0.71f, h * 0.3f)
                cubicTo(w * 0.62f, h * 0.2f, w * 0.38f, h * 0.2f, w * 0.29f, h * 0.3f)
            }
            drawPath(face, color = Ink.copy(alpha = 0.72f), style = stroke)

            val hairLeft = Path().apply {
                moveTo(w * 0.28f, h * 0.32f)
                cubicTo(w * 0.33f, h * 0.17f, w * 0.48f, h * 0.16f, w * 0.5f, h * 0.22f)
                cubicTo(w * 0.42f, h * 0.23f, w * 0.35f, h * 0.28f, w * 0.28f, h * 0.32f)
            }
            val hairRight = Path().apply {
                moveTo(w * 0.72f, h * 0.32f)
                cubicTo(w * 0.67f, h * 0.17f, w * 0.52f, h * 0.16f, w * 0.5f, h * 0.22f)
                cubicTo(w * 0.58f, h * 0.23f, w * 0.65f, h * 0.28f, w * 0.72f, h * 0.32f)
            }
            drawPath(hairLeft, color = Ink.copy(alpha = 0.62f), style = softStroke)
            drawPath(hairRight, color = Ink.copy(alpha = 0.62f), style = softStroke)

            drawOval(
                color = Ink.copy(alpha = 0.56f),
                topLeft = Offset(w * 0.35f, h * 0.44f),
                size = Size(w * 0.08f, h * 0.025f),
                style = softStroke,
            )
            drawOval(
                color = Ink.copy(alpha = 0.56f),
                topLeft = Offset(w * 0.57f, h * 0.44f),
                size = Size(w * 0.08f, h * 0.025f),
                style = softStroke,
            )

            val nose = Path().apply {
                moveTo(w * 0.5f, h * 0.47f)
                cubicTo(w * 0.47f, h * 0.54f, w * 0.48f, h * 0.58f, w * 0.45f, h * 0.61f)
                cubicTo(w * 0.48f, h * 0.63f, w * 0.52f, h * 0.63f, w * 0.55f, h * 0.61f)
            }
            drawPath(nose, color = Ink.copy(alpha = 0.5f), style = softStroke)

            val mouth = Path().apply {
                moveTo(w * 0.42f, h * 0.68f)
                cubicTo(w * 0.47f, h * 0.71f, w * 0.53f, h * 0.71f, w * 0.58f, h * 0.68f)
            }
            drawPath(mouth, color = Ink.copy(alpha = 0.55f), style = softStroke)

            if (signals.poreOrBlackheadFocus) {
                val dots = listOf(
                    Offset(w * 0.45f, h * 0.54f),
                    Offset(w * 0.5f, h * 0.55f),
                    Offset(w * 0.55f, h * 0.54f),
                    Offset(w * 0.48f, h * 0.59f),
                    Offset(w * 0.52f, h * 0.59f),
                )
                dots.forEach { point ->
                    drawCircle(color = Ink.copy(alpha = 0.32f), radius = w * 0.009f, center = point)
                }
            }

            if (signals.breakoutFocus) {
                listOf(
                    Offset(w * 0.39f, h * 0.59f),
                    Offset(w * 0.61f, h * 0.58f),
                    Offset(w * 0.5f, h * 0.71f),
                ).forEach { point ->
                    drawCircle(color = Terracotta.copy(alpha = 0.35f), radius = w * 0.016f, center = point)
                }
            }

            if (signals.pigmentationOrTextureFocus) {
                listOf(
                    Offset(w * 0.35f, h * 0.52f),
                    Offset(w * 0.65f, h * 0.52f),
                    Offset(w * 0.39f, h * 0.56f),
                    Offset(w * 0.61f, h * 0.56f),
                ).forEach { point ->
                    drawCircle(color = Amber.copy(alpha = 0.35f), radius = w * 0.012f, center = point)
                }
            }

            drawRoundRect(
                color = Color.Transparent,
                topLeft = Offset(w * 0.04f, h * 0.04f),
                size = Size(w * 0.92f, h * 0.92f),
                cornerRadius = androidx.compose.ui.geometry.CornerRadius(w * 0.04f),
                style = Stroke(width = w * 0.006f),
            )
            drawRoundRect(
                color = OutlineWarm.copy(alpha = 0.72f),
                topLeft = Offset(w * 0.04f, h * 0.04f),
                size = Size(w * 0.92f, h * 0.92f),
                cornerRadius = androidx.compose.ui.geometry.CornerRadius(w * 0.04f),
                style = Stroke(width = w * 0.006f),
            )
        }
    }
}

private fun String.isMeaningfulLevel(): Boolean = this == "medium" || this == "high"

private fun String.isMeaningfulTendency(): Boolean {
    return this == "sometimes" || this == "often" || this == "occasional" || this == "frequent"
}

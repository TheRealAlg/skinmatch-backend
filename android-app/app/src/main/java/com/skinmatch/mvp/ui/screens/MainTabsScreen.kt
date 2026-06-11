package com.skinmatch.mvp.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.Spa
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.skinmatch.mvp.di.AppContainer
import com.skinmatch.mvp.ui.components.ConsentBlockedState
import com.skinmatch.mvp.ui.components.EmptyState
import com.skinmatch.mvp.ui.components.InlineStatusRow
import com.skinmatch.mvp.ui.components.PremiumBackground
import com.skinmatch.mvp.ui.components.PrimaryActionButton
import com.skinmatch.mvp.ui.components.SectionCard
import com.skinmatch.mvp.ui.skinMatchViewModelFactory
import com.skinmatch.mvp.ui.theme.Cream
import com.skinmatch.mvp.ui.theme.Ink
import com.skinmatch.mvp.ui.theme.MutedInk
import com.skinmatch.mvp.ui.theme.Terracotta

enum class MainTab(
    val routeName: String,
    val label: String,
    val icon: ImageVector,
) {
    Home("home", "Ana Sayfa", Icons.Rounded.Home),
    Search("search", "Ara", Icons.Rounded.Search),
    Memory("memory", "Cilt Hafızam", Icons.Rounded.Spa),
    Profile("profile", "Profil", Icons.Rounded.Person),
}

fun mainTabFromRoute(routeName: String?): MainTab {
    return MainTab.entries.firstOrNull { it.routeName == routeName } ?: MainTab.Home
}

@Composable
fun MainTabsScreen(
    appContainer: AppContainer,
    selectedTab: MainTab,
    onTabSelected: (MainTab) -> Unit,
    onProductClick: (String) -> Unit,
    onOpenConsent: () -> Unit,
    onEditProfile: () -> Unit,
) {
    val profileSummaryViewModel: ProfileSummaryViewModel = viewModel(
        factory = skinMatchViewModelFactory {
            ProfileSummaryViewModel(
                skinProfileRepository = appContainer.skinProfileRepository,
                consentRepository = appContainer.consentRepository,
            )
        },
    )
    val profileSummary by profileSummaryViewModel.uiState.collectAsStateWithLifecycle()

    PremiumBackground {
        Scaffold(
            modifier = Modifier.fillMaxSize(),
            containerColor = androidx.compose.ui.graphics.Color.Transparent,
            bottomBar = {
                NavigationBar(containerColor = Cream) {
                    MainTab.entries.forEach { tab ->
                        NavigationBarItem(
                            selected = selectedTab == tab,
                            onClick = { onTabSelected(tab) },
                            icon = { Icon(tab.icon, contentDescription = null) },
                            label = { Text(tab.label, maxLines = 1) },
                        )
                    }
                }
            },
        ) { innerPadding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
            ) {
                when (selectedTab) {
                    MainTab.Home -> HomeTab(
                        hasProfile = profileSummary.profile != null,
                        onStartProfile = onOpenConsent,
                        onSearch = { onTabSelected(MainTab.Search) },
                    )
                    MainTab.Search -> {
                        val searchViewModel: ProductSearchViewModel = viewModel(
                            factory = skinMatchViewModelFactory {
                                ProductSearchViewModel(appContainer.productRepository)
                            },
                        )
                        ProductSearchScreen(
                            viewModel = searchViewModel,
                            onProductClick = onProductClick,
                        )
                    }
                    MainTab.Memory -> MemoryTab(
                        consentBlocked = !profileSummary.consent.canWriteSensitiveProfile,
                        hasProfile = profileSummary.profile != null,
                        onOpenConsent = onOpenConsent,
                    )
                    MainTab.Profile -> Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                            .padding(horizontal = 20.dp, vertical = 18.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp),
                    ) {
                        Text("Profil", style = MaterialTheme.typography.displayMedium, color = Ink)
                        Text(
                            "Cilt profilinizi ve onay durumunuzu buradan izleyebilirsiniz.",
                            style = MaterialTheme.typography.bodyLarge,
                            color = MutedInk,
                        )
                        ProfileSummaryContent(
                            uiState = profileSummary,
                            onOpenConsent = onOpenConsent,
                            onEditProfile = onEditProfile,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun HomeTab(
    hasProfile: Boolean,
    onStartProfile: () -> Unit,
    onSearch: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(PaddingValues(horizontal = 20.dp, vertical = 18.dp)),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Text("Merhaba", style = MaterialTheme.typography.displayMedium, color = Ink)
        Text(
            "Cilt profili ve Türkiye ürün verisi hazır olduğunda ana sayfa kişisel keşif merkezi olacak.",
            style = MaterialTheme.typography.bodyLarge,
            color = MutedInk,
        )

        SectionCard {
            InlineStatusRow(
                icon = Icons.Rounded.Home,
                title = "MVP ana sayfa",
                body = "Bu sürüm yerel öneri skoru hesaplamaz. Ürün keşfi backend katalog API ile çalışır.",
            )
            PrimaryActionButton(text = "Ürün ara", onClick = onSearch)
        }

        if (!hasProfile) {
            EmptyState("Profil henüz yok. Profil oluşturunca ürün ayrıntılarındaki uyumluluk notları daha anlamlı hale gelir.")
            PrimaryActionButton(text = "Cilt profilimi oluştur", onClick = onStartProfile)
        } else {
            SectionCard {
                InlineStatusRow(
                    icon = Icons.Rounded.Spa,
                    title = "Profil hazır",
                    body = "Cilt profili V1 alanları mock depoda kayıtlı. Backend profil API entegrasyonu sonraki adım.",
                )
            }
        }
    }
}

@Composable
private fun MemoryTab(
    consentBlocked: Boolean,
    hasProfile: Boolean,
    onOpenConsent: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 18.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Text("Cilt Hafızam", style = MaterialTheme.typography.displayMedium, color = Ink)
        Text(
            "Ürün geçmişi ve sonuç takibi bu MVP kapsamına alınmadı. Bu alan ileride içerik hafızasının evi olacak.",
            style = MaterialTheme.typography.bodyLarge,
            color = MutedInk,
        )

        when {
            consentBlocked -> ConsentBlockedState(onOpenConsent)
            !hasProfile -> EmptyState("Cilt hafızasını başlatmak için önce profil oluşturmanız gerekir.")
            else -> SectionCard {
                InlineStatusRow(
                    icon = Icons.Rounded.Spa,
                    title = "İçerik hafızası hazırlığı",
                    body = "Sevilen, dikkat edilen ve henüz emin olunmayan içerikler ürün geçmişi bağlanınca burada gösterilecek.",
                )
                Text(
                    "Şu an yalnızca güvenli boş durum gösterilir; ürün geçmişi ve yorum akışı Sprint 1 sonrası kapsama bırakıldı.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MutedInk,
                )
            }
        }
    }
}

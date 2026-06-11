package com.skinmatch.mvp.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.skinmatch.mvp.di.AppContainer
import com.skinmatch.mvp.ui.components.LoadingState
import com.skinmatch.mvp.ui.components.PremiumBackground
import com.skinmatch.mvp.ui.components.ScreenColumn
import com.skinmatch.mvp.ui.screens.ConsentScreen
import com.skinmatch.mvp.ui.screens.ConsentViewModel
import com.skinmatch.mvp.ui.screens.MainTab
import com.skinmatch.mvp.ui.screens.MainTabsScreen
import com.skinmatch.mvp.ui.screens.ProductDetailScreen
import com.skinmatch.mvp.ui.screens.ProductDetailViewModel
import com.skinmatch.mvp.ui.screens.ProfileSummaryScreen
import com.skinmatch.mvp.ui.screens.ProfileSummaryViewModel
import com.skinmatch.mvp.ui.screens.SkinProfileOnboardingScreen
import com.skinmatch.mvp.ui.screens.SkinProfileOnboardingViewModel
import com.skinmatch.mvp.ui.screens.WelcomeScreen
import com.skinmatch.mvp.ui.screens.mainTabFromRoute
import com.skinmatch.mvp.ui.skinMatchViewModelFactory
import kotlinx.coroutines.delay

private object Routes {
    const val AuthGate = "authGate"
    const val Welcome = "welcome"
    const val Consent = "consent"
    const val SkinProfile = "skinProfile"
    const val ProfileSummary = "profileSummary"
    const val MainTabs = "main/{tab}"
    const val ProductDetail = "product/{productId}"

    fun main(tab: MainTab) = "main/${tab.routeName}"
    fun product(productId: String) = "product/$productId"
}

@Composable
fun SkinMatchNavHost(appContainer: AppContainer) {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = Routes.AuthGate,
    ) {
        composable(Routes.AuthGate) {
            AuthGateScreen(
                onReady = {
                    navController.navigate(Routes.Welcome) {
                        popUpTo(Routes.AuthGate) { inclusive = true }
                    }
                },
            )
        }

        composable(Routes.Welcome) {
            WelcomeScreen(
                onBuildProfile = { navController.navigate(Routes.Consent) },
                onBrowseProducts = { navController.navigate(Routes.main(MainTab.Search)) },
            )
        }

        composable(Routes.Consent) {
            val consentViewModel: ConsentViewModel = viewModel(
                factory = skinMatchViewModelFactory {
                    ConsentViewModel(appContainer.consentRepository)
                },
            )
            ConsentScreen(
                viewModel = consentViewModel,
                onContinue = {
                    navController.navigate(Routes.SkinProfile) {
                        launchSingleTop = true
                    }
                },
            )
        }

        composable(Routes.SkinProfile) {
            val skinProfileViewModel: SkinProfileOnboardingViewModel = viewModel(
                factory = skinMatchViewModelFactory {
                    SkinProfileOnboardingViewModel(
                        skinProfileRepository = appContainer.skinProfileRepository,
                        consentRepository = appContainer.consentRepository,
                    )
                },
            )
            SkinProfileOnboardingScreen(
                viewModel = skinProfileViewModel,
                onOpenConsent = { navController.navigate(Routes.Consent) },
                onComplete = {
                    navController.navigate(Routes.ProfileSummary) {
                        launchSingleTop = true
                    }
                },
            )
        }

        composable(Routes.ProfileSummary) {
            val profileSummaryViewModel: ProfileSummaryViewModel = viewModel(
                factory = skinMatchViewModelFactory {
                    ProfileSummaryViewModel(
                        skinProfileRepository = appContainer.skinProfileRepository,
                        consentRepository = appContainer.consentRepository,
                    )
                },
            )
            ProfileSummaryScreen(
                viewModel = profileSummaryViewModel,
                onOpenConsent = { navController.navigate(Routes.Consent) },
                onEditProfile = { navController.navigate(Routes.SkinProfile) },
                onContinue = {
                    navController.navigate(Routes.main(MainTab.Home)) {
                        launchSingleTop = true
                    }
                },
            )
        }

        composable(
            route = Routes.MainTabs,
            arguments = listOf(navArgument("tab") { type = NavType.StringType }),
        ) { backStackEntry ->
            val tab = mainTabFromRoute(backStackEntry.arguments?.getString("tab"))
            MainTabsScreen(
                appContainer = appContainer,
                selectedTab = tab,
                onTabSelected = { nextTab ->
                    navController.navigate(Routes.main(nextTab)) {
                        launchSingleTop = true
                    }
                },
                onProductClick = { productId -> navController.navigate(Routes.product(productId)) },
                onOpenConsent = { navController.navigate(Routes.Consent) },
                onEditProfile = { navController.navigate(Routes.SkinProfile) },
            )
        }

        composable(
            route = Routes.ProductDetail,
            arguments = listOf(navArgument("productId") { type = NavType.StringType }),
        ) { backStackEntry ->
            val productId = backStackEntry.arguments?.getString("productId").orEmpty()
            val detailViewModel: ProductDetailViewModel = viewModel(
                factory = skinMatchViewModelFactory {
                    ProductDetailViewModel(appContainer.productRepository)
                },
            )
            ProductDetailScreen(
                productId = productId,
                viewModel = detailViewModel,
                onBack = { navController.popBackStack() },
            )
        }
    }
}

@Composable
private fun AuthGateScreen(onReady: () -> Unit) {
    LaunchedEffect(Unit) {
        delay(350)
        onReady()
    }

    PremiumBackground {
        ScreenColumn {
            LoadingState("Oturum hazırlanıyor")
        }
    }
}

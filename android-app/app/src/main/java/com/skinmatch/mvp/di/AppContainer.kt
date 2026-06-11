package com.skinmatch.mvp.di

import androidx.compose.runtime.staticCompositionLocalOf
import com.skinmatch.mvp.data.repository.ConsentRepository
import com.skinmatch.mvp.data.repository.MockConsentRepository
import com.skinmatch.mvp.data.repository.MockProductRepository
import com.skinmatch.mvp.data.repository.MockSkinProfileRepository
import com.skinmatch.mvp.data.repository.ProductRepository
import com.skinmatch.mvp.data.repository.SkinProfileRepository

class AppContainer {
    val consentRepository: ConsentRepository = MockConsentRepository()
    val skinProfileRepository: SkinProfileRepository = MockSkinProfileRepository()
    val productRepository: ProductRepository = MockProductRepository()
}

val LocalAppContainer = staticCompositionLocalOf<AppContainer> {
    error("AppContainer is not available")
}

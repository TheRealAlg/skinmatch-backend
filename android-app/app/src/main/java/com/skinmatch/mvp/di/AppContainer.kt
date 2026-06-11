package com.skinmatch.mvp.di

import androidx.compose.runtime.staticCompositionLocalOf
import com.google.gson.GsonBuilder
import com.skinmatch.mvp.BuildConfig
import com.skinmatch.mvp.data.api.SkinMatchApi
import com.skinmatch.mvp.data.repository.ConsentRepository
import com.skinmatch.mvp.data.repository.MockConsentRepository
import com.skinmatch.mvp.data.repository.MockSkinProfileRepository
import com.skinmatch.mvp.data.repository.ProductRepository
import com.skinmatch.mvp.data.repository.RetrofitProductRepository
import com.skinmatch.mvp.data.repository.SkinProfileRepository
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class AppContainer {
    private val okHttpClient = OkHttpClient.Builder().build()
    private val gson = GsonBuilder().create()
    private val retrofit = Retrofit.Builder()
        .baseUrl(BuildConfig.SKINMATCH_API_BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create(gson))
        .build()
    private val skinMatchApi: SkinMatchApi = retrofit.create(SkinMatchApi::class.java)

    val consentRepository: ConsentRepository = MockConsentRepository()
    val skinProfileRepository: SkinProfileRepository = MockSkinProfileRepository()
    val productRepository: ProductRepository = RetrofitProductRepository(skinMatchApi)
}

val LocalAppContainer = staticCompositionLocalOf<AppContainer> {
    error("AppContainer is not available")
}

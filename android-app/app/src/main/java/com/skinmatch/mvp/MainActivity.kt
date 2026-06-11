package com.skinmatch.mvp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.CompositionLocalProvider
import com.skinmatch.mvp.di.AppContainer
import com.skinmatch.mvp.di.LocalAppContainer
import com.skinmatch.mvp.ui.navigation.SkinMatchNavHost
import com.skinmatch.mvp.ui.theme.SkinMatchTheme

class MainActivity : ComponentActivity() {
    private val appContainer by lazy { AppContainer() }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            CompositionLocalProvider(LocalAppContainer provides appContainer) {
                SkinMatchTheme {
                    SkinMatchNavHost(appContainer = appContainer)
                }
            }
        }
    }
}

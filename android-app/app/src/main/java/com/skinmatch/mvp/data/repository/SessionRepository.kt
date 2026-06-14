package com.skinmatch.mvp.data.repository

import com.skinmatch.mvp.BuildConfig
import com.skinmatch.mvp.data.api.SkinMatchApi
import com.skinmatch.mvp.data.dto.CreateSessionRequestDto

interface SessionRepository {
    suspend fun authHeader(): String
}

class BackendSessionRepository(
    private val api: SkinMatchApi,
    private val devIdToken: String = BuildConfig.SKINMATCH_DEV_ID_TOKEN,
) : SessionRepository {
    private var cachedAccessToken: String? = null

    override suspend fun authHeader(): String {
        cachedAccessToken?.let { return "Bearer $it" }

        val data = api.createSession(CreateSessionRequestDto(idToken = devIdToken))
            .requireApiData("Session")
        val token = data.accessToken?.takeIf { it.isNotBlank() }
            ?: throw SkinMatchApiException("Session response did not include an access token.")

        cachedAccessToken = token
        return "Bearer $token"
    }
}

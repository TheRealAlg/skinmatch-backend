package com.skinmatch.mvp.data.repository

import com.skinmatch.mvp.data.dto.EnvelopeDto

class SkinMatchApiException(message: String) : RuntimeException(message)

internal fun <T> EnvelopeDto<T>.requireApiData(context: String): T {
    data?.let { return it }
    val apiMessage = error?.message?.takeIf { it.isNotBlank() }
    val apiCode = error?.code?.takeIf { it.isNotBlank() }
    throw SkinMatchApiException(apiMessage ?: apiCode ?: "$context response did not include data.")
}

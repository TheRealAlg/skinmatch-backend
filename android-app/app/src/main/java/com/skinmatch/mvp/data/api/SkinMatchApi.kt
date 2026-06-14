package com.skinmatch.mvp.data.api

import com.skinmatch.mvp.data.dto.BarcodeLookupEnvelopeDto
import com.skinmatch.mvp.data.dto.AuthSessionEnvelopeDto
import com.skinmatch.mvp.data.dto.ConsentDto
import com.skinmatch.mvp.data.dto.ConsentsEnvelopeDto
import com.skinmatch.mvp.data.dto.CreateSessionRequestDto
import com.skinmatch.mvp.data.dto.EnvelopeDto
import com.skinmatch.mvp.data.dto.ProductDetailEnvelopeDto
import com.skinmatch.mvp.data.dto.ProductSearchEnvelopeDto
import com.skinmatch.mvp.data.dto.SkinProfileEnvelopeDto
import com.skinmatch.mvp.data.dto.UpdateSkinProfileRequestDto
import com.skinmatch.mvp.data.dto.UpsertConsentRequestDto
import retrofit2.http.GET
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.Path
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Query

interface SkinMatchApi {
    @POST("api/v1/auth/session")
    suspend fun createSession(
        @Body request: CreateSessionRequestDto,
    ): EnvelopeDto<AuthSessionEnvelopeDto>

    @GET("api/v1/me/consents")
    suspend fun getConsents(
        @Header("Authorization") authorization: String,
    ): EnvelopeDto<ConsentsEnvelopeDto>

    @POST("api/v1/me/consents")
    suspend fun recordConsent(
        @Header("Authorization") authorization: String,
        @Body request: UpsertConsentRequestDto,
    ): EnvelopeDto<ConsentDto>

    @GET("api/v1/me/skin-profile")
    suspend fun getSkinProfile(
        @Header("Authorization") authorization: String,
    ): EnvelopeDto<SkinProfileEnvelopeDto>

    @PUT("api/v1/me/skin-profile")
    suspend fun updateSkinProfile(
        @Header("Authorization") authorization: String,
        @Body request: UpdateSkinProfileRequestDto,
    ): EnvelopeDto<SkinProfileEnvelopeDto>

    @GET("api/v1/products/search")
    suspend fun searchProducts(
        @Query("q") query: String? = null,
        @Query("marketCode") marketCode: String = "TR",
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
    ): EnvelopeDto<ProductSearchEnvelopeDto>

    @GET("api/v1/products/{id}")
    suspend fun productDetail(
        @Path("id") id: String,
    ): EnvelopeDto<ProductDetailEnvelopeDto>

    @GET("api/v1/products/barcode/{gtin}")
    suspend fun barcodeLookup(
        @Path("gtin") gtin: String,
        @Query("marketCode") marketCode: String = "TR",
    ): EnvelopeDto<BarcodeLookupEnvelopeDto>
}

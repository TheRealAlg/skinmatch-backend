package com.skinmatch.mvp.data.api

import com.skinmatch.mvp.data.dto.BarcodeLookupEnvelopeDto
import com.skinmatch.mvp.data.dto.EnvelopeDto
import com.skinmatch.mvp.data.dto.ProductDetailEnvelopeDto
import com.skinmatch.mvp.data.dto.ProductSearchEnvelopeDto
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

interface SkinMatchApi {
    @GET("api/v1/products/search")
    suspend fun searchProducts(
        @Query("q") query: String,
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

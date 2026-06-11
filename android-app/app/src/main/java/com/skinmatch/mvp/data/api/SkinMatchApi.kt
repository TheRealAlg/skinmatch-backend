package com.skinmatch.mvp.data.api

import com.skinmatch.mvp.data.dto.EnvelopeDto
import com.skinmatch.mvp.data.dto.ProductDetailDto
import com.skinmatch.mvp.data.dto.ProductSearchDto
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

interface SkinMatchApi {
    @GET("api/v1/products")
    suspend fun searchProducts(
        @Query("q") query: String,
        @Query("market") market: String = "TR",
        @Query("locale") locale: String = "tr-TR",
    ): EnvelopeDto<List<ProductSearchDto>>

    @GET("api/v1/products/{productMarketId}")
    suspend fun productDetail(
        @Path("productMarketId") productMarketId: String,
    ): EnvelopeDto<ProductDetailDto>
}

import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { BarcodeLookupQueryDto } from "./dto/barcode-lookup-query.dto";
import { SearchProductsQueryDto } from "./dto/search-products-query.dto";
import { ProductsService } from "./products.service";

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get("search")
  searchProducts(@Query() query: SearchProductsQueryDto) {
    return this.productsService.searchProducts(query);
  }

  @Get("barcode/:gtin")
  lookupBarcode(@Param("gtin") gtin: string, @Query() query: BarcodeLookupQueryDto) {
    return this.productsService.lookupBarcode(gtin, query);
  }

  @Get(":id")
  getProduct(@Param("id", new ParseUUIDPipe({ version: "4" })) id: string) {
    return this.productsService.getProduct(id);
  }
}

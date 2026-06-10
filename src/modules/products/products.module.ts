import { Module } from "@nestjs/common";
import { PrismaModule } from "../../common/database/prisma.module";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { ProductSearchService } from "./search.service";

@Module({
  imports: [PrismaModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductSearchService]
})
export class ProductsModule {}

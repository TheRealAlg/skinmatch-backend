import { Module } from "@nestjs/common";
import { PrismaModule } from "../../common/database/prisma.module";
import { AdminCatalogController } from "./admin-catalog.controller";
import { AdminCatalogService } from "./admin-catalog.service";
import { AdminKeyGuard } from "./admin-key.guard";

@Module({
  imports: [PrismaModule],
  controllers: [AdminCatalogController],
  providers: [AdminCatalogService, AdminKeyGuard]
})
export class AdminModule {}

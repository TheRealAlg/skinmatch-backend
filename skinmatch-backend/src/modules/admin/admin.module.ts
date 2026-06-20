import { Module } from "@nestjs/common";
import { PrismaModule } from "../../common/database/prisma.module";
import { AdminCatalogController } from "./admin-catalog.controller";
import { AdminCatalogService } from "./admin-catalog.service";
import { AdminKeyGuard } from "./admin-key.guard";
import { AdminPanelController } from "./admin-panel.controller";

@Module({
  imports: [PrismaModule],
  controllers: [AdminCatalogController, AdminPanelController],
  providers: [AdminCatalogService, AdminKeyGuard]
})
export class AdminModule {}

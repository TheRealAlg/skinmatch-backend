import { Controller, Get, Res } from "@nestjs/common";
import { Response } from "express";
import { AdminCatalogService } from "./admin-catalog.service";

@Controller("admin")
export class AdminPanelController {
  constructor(private readonly adminCatalogService: AdminCatalogService) {}

  @Get()
  root(@Res() response: Response) {
    response.redirect(302, "/api/v1/admin/catalog/panel");
  }

  @Get("catalog/panel")
  async panel(@Res() response: Response) {
    response.type("html").send(await this.adminCatalogService.getPanelHtml());
  }
}

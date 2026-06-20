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
    response
      .setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data: https:; base-uri 'self'; form-action 'self'"
      )
      .type("html")
      .send(await this.adminCatalogService.getPanelHtml());
  }
}

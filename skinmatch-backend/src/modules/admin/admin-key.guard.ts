import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";

@Injectable()
export class AdminKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const configuredKey =
      this.config.get<string>("ADMIN_API_KEY") ||
      (this.config.get<string>("NODE_ENV") === "production" ? "" : "skinmatch-local-admin");
    const providedKey = request.header("x-skinmatch-admin-key");

    if (!configuredKey || providedKey !== configuredKey) {
      throw new UnauthorizedException("Missing or invalid admin key");
    }

    return true;
  }
}

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { PrismaService } from "../../common/database/prisma.service";
import { AuthService } from "./auth.service";
import { CurrentUser } from "./types/current-user";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: CurrentUser }>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException("Missing bearer token");
    }

    const payload = await this.authService.validateAccessToken(token);
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { defaultMarket: true }
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException("Invalid user session");
    }

    request.user = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      marketCode: user.defaultMarket.marketCode,
      locale: user.locale
    };

    return true;
  }

  private extractBearerToken(request: Request) {
    const header = request.header("authorization");
    if (!header) return null;
    const [type, token] = header.split(" ");
    if (type !== "Bearer" || !token) return null;
    return token;
  }
}

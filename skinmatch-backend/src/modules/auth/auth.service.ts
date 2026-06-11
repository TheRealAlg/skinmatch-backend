import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../common/database/prisma.service";
import { AuthProviderService } from "./auth-provider.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authProvider: AuthProviderService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService
  ) {}

  async createSession(idToken: string) {
    const identity = await this.authProvider.verifyIdentityToken(idToken);
    const marketCode = this.config.get<string>("DEFAULT_MARKET_CODE", "TR");
    const locale = this.config.get<string>("DEFAULT_LOCALE", "tr-TR");
    const market = await this.prisma.market.findUnique({ where: { marketCode } });

    if (!market) {
      throw new UnauthorizedException(`Default market ${marketCode} is not seeded`);
    }

    const user = await this.prisma.user.upsert({
      where: {
        authProvider_providerSubject: {
          authProvider: identity.provider,
          providerSubject: identity.providerSubject
        }
      },
      update: {
        email: identity.email,
        displayName: identity.displayName,
        locale
      },
      create: {
        authProvider: identity.provider,
        providerSubject: identity.providerSubject,
        email: identity.email,
        displayName: identity.displayName,
        defaultMarketId: market.id,
        locale
      },
      include: {
        defaultMarket: true
      }
    });

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        marketCode: user.defaultMarket.marketCode,
        locale: user.locale
      },
      {
        secret: this.config.get<string>("JWT_SECRET"),
        expiresIn: this.config.get<string>("JWT_EXPIRES_IN", "1h")
      }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        defaultMarket: user.defaultMarket.marketCode,
        locale: user.locale
      },
      accessToken
    };
  }

  async validateAccessToken(token: string) {
    return this.jwtService.verifyAsync<{ sub: string; marketCode: string; locale: string }>(token, {
      secret: this.config.get<string>("JWT_SECRET")
    });
  }
}

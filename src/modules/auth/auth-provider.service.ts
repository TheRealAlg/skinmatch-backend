import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export type VerifiedIdentity = {
  provider: string;
  providerSubject: string;
  email: string | null;
  displayName: string | null;
};

@Injectable()
export class AuthProviderService {
  constructor(private readonly config: ConfigService) {}

  async verifyIdentityToken(idToken: string): Promise<VerifiedIdentity> {
    const provider = this.config.get<string>("AUTH_PROVIDER", "mock");
    if (provider === "mock") {
      return this.verifyMockToken(idToken);
    }

    throw new UnauthorizedException("Firebase auth adapter is not configured yet");
  }

  private verifyMockToken(idToken: string): VerifiedIdentity {
    const allowMock = this.config.get<boolean>("ALLOW_MOCK_AUTH", false);
    const nodeEnv = this.config.get<string>("NODE_ENV", "development");

    if (!allowMock || nodeEnv === "production") {
      throw new UnauthorizedException("Mock auth is disabled");
    }

    const safeSubject = idToken.trim();
    if (!safeSubject) {
      throw new UnauthorizedException("Invalid identity token");
    }

    return {
      provider: "mock",
      providerSubject: safeSubject,
      email: `${safeSubject}@mock.local`,
      displayName: "Mock User"
    };
  }
}

import { ConfigService } from "@nestjs/config";
import { UnauthorizedException } from "@nestjs/common";
import { AuthProviderService } from "../../src/modules/auth/auth-provider.service";

describe("AuthProviderService", () => {
  it("accepts mock tokens only when explicitly enabled", async () => {
    const service = new AuthProviderService(
      new ConfigService({
        AUTH_PROVIDER: "mock",
        ALLOW_MOCK_AUTH: true,
        NODE_ENV: "development"
      })
    );

    await expect(service.verifyIdentityToken("local-user-1")).resolves.toMatchObject({
      provider: "mock",
      providerSubject: "local-user-1"
    });
  });

  it("rejects mock tokens when mock auth is disabled", async () => {
    const service = new AuthProviderService(
      new ConfigService({
        AUTH_PROVIDER: "mock",
        ALLOW_MOCK_AUTH: false,
        NODE_ENV: "development"
      })
    );

    await expect(service.verifyIdentityToken("local-user-1")).rejects.toBeInstanceOf(
      UnauthorizedException
    );
  });
});

import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthProviderService } from "./auth-provider.service";
import { AuthService } from "./auth.service";
import { AuthGuard } from "./auth.guard";

@Module({
  controllers: [AuthController],
  providers: [AuthProviderService, AuthService, AuthGuard],
  exports: [AuthService, AuthGuard]
})
export class AuthModule {}

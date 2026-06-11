import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ConsentsModule } from "../consents/consents.module";
import { SkinProfileController } from "./skin-profile.controller";
import { SkinProfileService } from "./skin-profile.service";

@Module({
  imports: [AuthModule, ConsentsModule],
  controllers: [SkinProfileController],
  providers: [SkinProfileService]
})
export class SkinProfileModule {}

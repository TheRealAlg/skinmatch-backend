import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUserDecorator } from "../auth/current-user.decorator";
import { CurrentUser } from "../auth/types/current-user";
import { UpdateSkinProfileDto } from "./dto/update-skin-profile.dto";
import { SkinProfileService } from "./skin-profile.service";

@UseGuards(AuthGuard)
@Controller("me/skin-profile")
export class SkinProfileController {
  constructor(private readonly skinProfileService: SkinProfileService) {}

  @Get()
  getProfile(@CurrentUserDecorator() user: CurrentUser) {
    return this.skinProfileService.getProfile(user.id);
  }

  @Put()
  updateProfile(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: UpdateSkinProfileDto
  ) {
    return this.skinProfileService.updateProfile(user.id, dto);
  }
}

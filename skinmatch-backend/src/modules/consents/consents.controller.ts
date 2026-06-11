import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUserDecorator } from "../auth/current-user.decorator";
import { CurrentUser } from "../auth/types/current-user";
import { ConsentsService } from "./consents.service";
import { UpsertConsentDto } from "./dto/upsert-consent.dto";

@UseGuards(AuthGuard)
@Controller("me")
export class ConsentsController {
  constructor(private readonly consentsService: ConsentsService) {}

  @Get("consents")
  getConsents(@CurrentUserDecorator() user: CurrentUser) {
    return this.consentsService.getLatestConsents(user.id);
  }

  @Post("consents")
  recordConsent(@CurrentUserDecorator() user: CurrentUser, @Body() dto: UpsertConsentDto) {
    return this.consentsService.recordConsent(user.id, dto);
  }

  @Post("delete-account-request")
  requestDeletion(@CurrentUserDecorator() user: CurrentUser) {
    return this.consentsService.requestAccountDeletion(user.id);
  }
}

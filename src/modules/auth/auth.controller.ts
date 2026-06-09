import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CreateSessionDto } from "./dto/create-session.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("session")
  createSession(@Body() dto: CreateSessionDto) {
    return this.authService.createSession(dto.idToken);
  }
}

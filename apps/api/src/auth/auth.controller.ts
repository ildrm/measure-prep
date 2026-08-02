import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { Request, Response } from "express";
import { CurrentUser, Public } from "./auth.decorators";
import { EmailDto, LoginDto, RegisterDto, ResetPasswordDto, TokenDto } from "./auth.dto";
import { AuthService } from "./auth.service";
import { RateLimitGuard } from "./rate-limit.guard";

@UseGuards(RateLimitGuard)
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Public() @Post("register") register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) { return this.auth.register(dto, res); }
  @Public() @Post("login") login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) { return this.auth.login(dto, res); }
  @Public() @Post("refresh") refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) { return this.auth.refresh(req.cookies?.refresh_token, res); }
  @Public() @Post("verification/request") requestVerification(@Body() dto: EmailDto) { return this.auth.requestVerification(dto.email); }
  @Public() @Post("verification/confirm") verifyEmail(@Body() dto: TokenDto) { return this.auth.verifyEmail(dto.token); }
  @Public() @Post("password-reset/request") requestReset(@Body() dto: EmailDto) { return this.auth.requestPasswordReset(dto.email); }
  @Public() @Post("password-reset/confirm") reset(@Body() dto: ResetPasswordDto) { return this.auth.resetPassword(dto.token, dto.password); }
  @Get("me") me(@CurrentUser() user: { id: string; email: string; name: string; role: string }) { return { user }; }
  @Post("logout") logout(@CurrentUser() user: { id: string }, @Res({ passthrough: true }) res: Response) { return this.auth.logout(user.id, res); }
}

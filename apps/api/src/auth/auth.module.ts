import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthGuard } from "./auth.guard";
import { AuthService } from "./auth.service";
import { RateLimitGuard } from "./rate-limit.guard";
import { MailService } from "./mail.service";

@Module({ imports: [JwtModule.register({})], controllers: [AuthController], providers: [AuthService, MailService, RateLimitGuard, { provide: APP_GUARD, useClass: AuthGuard }], exports: [JwtModule, MailService] })
export class AuthModule {}

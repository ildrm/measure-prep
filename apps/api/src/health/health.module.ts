import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { SessionsModule } from "../sessions/sessions.module";
import { HealthController } from "./health.controller";

@Module({ imports: [AuthModule, SessionsModule], controllers: [HealthController] })
export class HealthModule {}

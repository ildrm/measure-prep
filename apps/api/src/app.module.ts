import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { ExamsModule } from "./exams/exams.module";
import { SessionsModule } from "./sessions/sessions.module";
import { AdminModule } from "./admin/admin.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { MediaModule } from "./media/media.module";
import { validateEnvironment } from "./config/validate-env";
import { HealthModule } from "./health/health.module";

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }), ScheduleModule.forRoot(), PrismaModule, AuthModule, ExamsModule, SessionsModule, AdminModule, AnalyticsModule, MediaModule, HealthModule] })
export class AppModule {}

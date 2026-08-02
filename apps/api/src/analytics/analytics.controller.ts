import { Controller, Get } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser, Roles } from "../auth/auth.decorators";
import { AnalyticsService } from "./analytics.service";
@Controller()
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}
  @Get("me/progress") progress(@CurrentUser() user: { id: string }) { return this.analytics.progress(user.id); }
  @Roles(Role.ADMIN, Role.CONTENT_EDITOR) @Get("admin/analytics/questions") questions() { return this.analytics.questions(); }
}

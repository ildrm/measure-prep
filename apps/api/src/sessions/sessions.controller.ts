import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser } from "../auth/auth.decorators";
import { IntegrityEventDto, SaveAnswerDto, StartSessionDto } from "./sessions.dto";
import { SessionsService } from "./sessions.service";
@Controller("sessions")
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}
  @Post() start(@CurrentUser() user: { id: string }, @Body() dto: StartSessionDto) { return this.sessions.start(user.id, dto.testFormId); }
  @Get(":id") get(@CurrentUser() user: { id: string; role: Role }, @Param("id") id: string) { return this.sessions.get(user, id); }
  @Patch(":id/answers/:questionId") save(@CurrentUser() user: { id: string; role: Role }, @Param("id") id: string, @Param("questionId") questionId: string, @Body() dto: SaveAnswerDto) { return this.sessions.save(user, id, questionId, dto); }
  @Post(":id/sections/:sectionId/submit") section(@CurrentUser() user: { id: string; role: Role }, @Param("id") id: string, @Param("sectionId") sectionId: string) { return this.sessions.submitSection(user, id, sectionId); }
  @Post(":id/submit") submit(@CurrentUser() user: { id: string; role: Role }, @Param("id") id: string) { return this.sessions.submit(user, id); }
  @Post(":id/integrity") integrity(@CurrentUser() user: { id: string; role: Role }, @Param("id") id: string, @Body() dto: IntegrityEventDto) { return this.sessions.integrity(user, id, dto); }
  @Get(":id/score") review(@CurrentUser() user: { id: string; role: Role }, @Param("id") id: string) { return this.sessions.review(user, id); }
}

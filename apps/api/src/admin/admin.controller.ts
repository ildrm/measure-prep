import { Body, Controller, Delete, Get, Param, Patch, Post, UseInterceptors } from "@nestjs/common";
import { Role } from "@prisma/client";
import { Roles } from "../auth/auth.decorators";
import { AdminService } from "./admin.service";
import { AudioDto, ExamDto, FeatureFlagDto, ImportDto, PassageDto, QuestionDto, RoleDto, SectionDto, TestFormDto } from "./admin.dto";
import { AdminAuditInterceptor } from "./admin-audit.interceptor";

@Roles(Role.ADMIN, Role.CONTENT_EDITOR)
@UseInterceptors(AdminAuditInterceptor)
@Controller("admin")
export class AdminController {
  constructor(private readonly admin: AdminService) {}
  @Get("content") list() { return this.admin.list(); }
  @Roles(Role.ADMIN) @Get("users") users() { return this.admin.users(); }
  @Roles(Role.ADMIN) @Patch("users/:id/role") updateRole(@Param("id") id: string, @Body() dto: RoleDto) { return this.admin.updateRole(id, dto.role); }
  @Get("audit") audit() { return this.admin.audit(); }
  @Get("feature-flags") flags() { return this.admin.flags(); }
  @Post("feature-flags") setFlag(@Body() dto: FeatureFlagDto) { return this.admin.setFlag(dto); }
  @Post("exams") createExam(@Body() dto: ExamDto) { return this.admin.createExam(dto); }
  @Patch("exams/:id") updateExam(@Param("id") id: string, @Body() dto: ExamDto) { return this.admin.updateExam(id, dto); }
  @Delete("exams/:id") deleteExam(@Param("id") id: string) { return this.admin.deleteExam(id); }
  @Post("sections") createSection(@Body() dto: SectionDto) { return this.admin.createSection(dto); }
  @Patch("sections/:id") updateSection(@Param("id") id: string, @Body() dto: SectionDto) { return this.admin.updateSection(id, dto); }
  @Delete("sections/:id") deleteSection(@Param("id") id: string) { return this.admin.deleteSection(id); }
  @Post("passages") createPassage(@Body() dto: PassageDto) { return this.admin.createPassage(dto); }
  @Patch("passages/:id") updatePassage(@Param("id") id: string, @Body() dto: PassageDto) { return this.admin.updatePassage(id, dto); }
  @Delete("passages/:id") deletePassage(@Param("id") id: string) { return this.admin.deletePassage(id); }
  @Post("audio-assets") createAudio(@Body() dto: AudioDto) { return this.admin.createAudio(dto); }
  @Patch("audio-assets/:id") updateAudio(@Param("id") id: string, @Body() dto: AudioDto) { return this.admin.updateAudio(id, dto); }
  @Delete("audio-assets/:id") deleteAudio(@Param("id") id: string) { return this.admin.deleteAudio(id); }
  @Post("questions") createQuestion(@Body() dto: QuestionDto) { return this.admin.createQuestion(dto); }
  @Patch("questions/:id") updateQuestion(@Param("id") id: string, @Body() dto: QuestionDto) { return this.admin.updateQuestion(id, dto); }
  @Delete("questions/:id") deleteQuestion(@Param("id") id: string) { return this.admin.deleteQuestion(id); }
  @Post("test-forms") createForm(@Body() dto: TestFormDto) { return this.admin.createForm(dto); }
  @Patch("test-forms/:id") updateForm(@Param("id") id: string, @Body() dto: TestFormDto) { return this.admin.updateForm(id, dto); }
  @Delete("test-forms/:id") deleteForm(@Param("id") id: string) { return this.admin.deleteForm(id); }
  @Post("import") import(@Body() dto: ImportDto) { return this.admin.import(dto); }
}

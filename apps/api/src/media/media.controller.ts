import { Body, Controller, ForbiddenException, Get, Param, Post, Res } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser, Roles } from "../auth/auth.decorators";
import { UploadDto } from "./media.dto";
import { MediaService } from "./media.service";
import { PrismaService } from "../prisma/prisma.service";
@Controller("media")
export class MediaController {
  constructor(private readonly media: MediaService, private readonly prisma: PrismaService) {}
  @Roles(Role.ADMIN, Role.CONTENT_EDITOR) @Post("upload") upload(@Body() dto: UploadDto) { return this.media.upload(dto.filename, dto.contentType); }
  @Post("sessions/:sessionId/response-upload")
  async responseUpload(@CurrentUser() user: { id: string }, @Param("sessionId") sessionId: string, @Body() dto: UploadDto) {
    const session = await this.prisma.testSession.findFirst({ where: { id: sessionId, userId: user.id, status: "IN_PROGRESS" } });
    if (!session) throw new ForbiddenException("This session is not accepting response uploads.");
    return this.media.upload(`responses-${dto.filename}`, dto.contentType);
  }
  @Get("sessions/:sessionId/audio/:audioId")
  async audio(@CurrentUser() user: { id: string; role: Role }, @Param("sessionId") sessionId: string, @Param("audioId") audioId: string, @Res() response: import("express").Response) {
    const session = await this.prisma.testSession.findUnique({ where: { id: sessionId }, include: { testForm: { include: { sections: true } } } });
    const audio = await this.prisma.audioAsset.findUnique({ where: { id: audioId } });
    if (!session || !audio || (session.userId !== user.id && user.role !== Role.ADMIN) || !session.testForm.sections.some((s) => s.sectionId === audio.sectionId)) throw new ForbiddenException("This audio is not available for the session.");
    const object = await this.media.getObject(audio.storageKey);
    response.setHeader("content-type", object.ContentType ?? "audio/mpeg"); response.setHeader("cache-control", "private, max-age=900");
    const body = object.Body as unknown as NodeJS.ReadableStream; body.pipe(response);
  }
}

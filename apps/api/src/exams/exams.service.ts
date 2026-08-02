import { Injectable, NotFoundException } from "@nestjs/common";
import { ExamCode } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}
  list() {
    return this.prisma.exam.findMany({ orderBy: { name: "asc" }, include: { testForms: { where: { isPublished: true }, select: { id: true, name: true, slug: true, version: true, sections: { select: { section: { select: { timeLimitSec: true } } } } } } } });
  }
  async forms(code: string) {
    if (!Object.values(ExamCode).includes(code as ExamCode)) throw new NotFoundException("Exam was not found.");
    return this.prisma.testForm.findMany({ where: { exam: { code: code as ExamCode }, isPublished: true }, include: { exam: true, sections: { orderBy: { order: "asc" }, include: { section: true } } } });
  }
}

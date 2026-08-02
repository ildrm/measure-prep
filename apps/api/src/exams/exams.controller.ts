import { Controller, Get, Param } from "@nestjs/common";
import { Public } from "../auth/auth.decorators";
import { ExamsService } from "./exams.service";
@Public()
@Controller("exams")
export class ExamsController {
  constructor(private readonly exams: ExamsService) {}
  @Get() list() { return this.exams.list(); }
  @Get(":code/forms") forms(@Param("code") code: string) { return this.exams.forms(code); }
}

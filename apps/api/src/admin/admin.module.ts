import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { AdminAuditInterceptor } from "./admin-audit.interceptor";
@Module({ controllers: [AdminController], providers: [AdminService, AdminAuditInterceptor] })
export class AdminModule {}

import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Observable, tap } from "rxjs";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AdminAuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    if (request.method === "GET") return next.handle();
    return next.handle().pipe(tap((result: { id?: string } | undefined) => {
      const path = String(request.route?.path ?? request.url);
      const entity = path.split("/").filter(Boolean).at(-1) ?? "content";
      void this.prisma.auditLog.create({ data: {
        actorId: request.user?.id,
        action: `admin.${request.method.toLowerCase()}`,
        entity,
        entityId: request.params?.id ?? result?.id ?? "bulk",
        diff: { body: request.body, path } as Prisma.InputJsonValue,
      } }).catch(() => undefined);
    }));
  }
}

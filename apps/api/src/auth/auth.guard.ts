import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Role } from "@prisma/client";
import { IS_PUBLIC_KEY, ROLES_KEY } from "./auth.decorators";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly jwt: JwtService) {}
  canActivate(context: ExecutionContext) {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])) return true;
    const request = context.switchToHttp().getRequest();
    const bearer = request.headers.authorization?.replace(/^Bearer\s+/i, "");
    const token = request.cookies?.access_token ?? bearer;
    if (!token) throw new UnauthorizedException("Sign in to continue.");
    try { request.user = this.jwt.verify(token, { secret: process.env.JWT_ACCESS_SECRET }); }
    catch { throw new UnauthorizedException("Your session has expired. Sign in again."); }
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (roles?.length && !roles.includes(request.user.role)) throw new ForbiddenException("Your role does not permit this action.");
    return true;
  }
}

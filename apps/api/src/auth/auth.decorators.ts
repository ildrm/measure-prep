import { createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";
import { Role, User } from "@prisma/client";
export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const ROLES_KEY = "roles";
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): Pick<User, "id" | "email" | "name" | "role"> => context.switchToHttp().getRequest().user);

import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcryptjs";
import { Response } from "express";
import { createHash, randomBytes } from "crypto";
import { AuthTokenType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto, RegisterDto } from "./auth.dto";
import { MailService } from "./mail.service";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService, private readonly mail: MailService) {}
  async register(dto: RegisterDto, response: Response) {
    const email = dto.email.trim().toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) throw new ConflictException("An account already exists for this email.");
    const user = await this.prisma.user.create({ data: { email, name: dto.name.trim(), passwordHash: await hash(dto.password, 12) } });
    const auth = await this.issue(user, response);
    const verificationToken = await this.createAuthToken(user.id, AuthTokenType.EMAIL_VERIFICATION, 24 * 60);
    await this.mail.sendVerification(user.email, verificationToken);
    return { ...auth, verificationRequired: true, ...(process.env.NODE_ENV !== "production" ? { devVerificationToken: verificationToken } : {}) };
  }
  async login(dto: LoginDto, response: Response) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.trim().toLowerCase() } });
    if (!user || !(await compare(dto.password, user.passwordHash))) throw new UnauthorizedException("Email or password is incorrect.");
    return this.issue(user, response);
  }
  async refresh(refreshToken: string | undefined, response: Response) {
    if (!refreshToken) throw new UnauthorizedException("Refresh token is missing.");
    let payload: { sub: string };
    try { payload = this.jwt.verify(refreshToken, { secret: process.env.JWT_REFRESH_SECRET }); }
    catch { throw new UnauthorizedException("Refresh token is invalid."); }
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user?.refreshTokenHash || !(await compare(refreshToken, user.refreshTokenHash))) throw new UnauthorizedException("Refresh token was already rotated.");
    return this.issue(user, response);
  }
  async logout(userId: string, response: Response) {
    await this.prisma.user.update({ where: { id: userId }, data: { refreshTokenHash: null } });
    response.clearCookie("access_token"); response.clearCookie("refresh_token");
    return { ok: true };
  }
  async requestVerification(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || user.emailVerifiedAt) return { ok: true };
    const token = await this.createAuthToken(user.id, AuthTokenType.EMAIL_VERIFICATION, 24 * 60);
    await this.mail.sendVerification(user.email, token);
    return { ok: true, ...(process.env.NODE_ENV !== "production" ? { devToken: token } : {}) };
  }
  async verifyEmail(token: string) {
    const record = await this.consumeToken(token, AuthTokenType.EMAIL_VERIFICATION);
    await this.prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } });
    return { verified: true };
  }
  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) return { ok: true };
    const token = await this.createAuthToken(user.id, AuthTokenType.PASSWORD_RESET, 30);
    await this.mail.sendPasswordReset(user.email, token);
    return { ok: true, ...(process.env.NODE_ENV !== "production" ? { devToken: token } : {}) };
  }
  async resetPassword(token: string, password: string) {
    const record = await this.consumeToken(token, AuthTokenType.PASSWORD_RESET);
    await this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash: await hash(password, 12), refreshTokenHash: null } });
    return { reset: true };
  }
  private async createAuthToken(userId: string, type: AuthTokenType, minutes: number) {
    await this.prisma.authToken.deleteMany({ where: { userId, type, usedAt: null } });
    const token = randomBytes(32).toString("hex");
    await this.prisma.authToken.create({ data: { userId, type, tokenHash: this.tokenHash(token), expiresAt: new Date(Date.now() + minutes * 60000) } });
    return token;
  }
  private async consumeToken(token: string, type: AuthTokenType) {
    const record = await this.prisma.authToken.findFirst({ where: { tokenHash: this.tokenHash(token), type, usedAt: null, expiresAt: { gt: new Date() } } });
    if (!record) throw new UnauthorizedException("This token is invalid or has expired.");
    return this.prisma.authToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  }
  private tokenHash(token: string) { return createHash("sha256").update(token).digest("hex"); }
  private async issue(user: { id: string; email: string; name: string; role: string }, response: Response) {
    const payload = { sub: user.id, id: user.id, email: user.email, name: user.name, role: user.role };
    const access = this.jwt.sign(payload, { secret: process.env.JWT_ACCESS_SECRET, expiresIn: process.env.ACCESS_TOKEN_TTL ?? "15m" } as never);
    const days = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 7);
    const refresh = this.jwt.sign({ sub: user.id }, { secret: process.env.JWT_REFRESH_SECRET, expiresIn: `${days}d` });
    await this.prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: await hash(refresh, 10) } });
    const cookie = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
    response.cookie("access_token", access, { ...cookie, maxAge: 15 * 60 * 1000 });
    response.cookie("refresh_token", refresh, { ...cookie, maxAge: days * 86400000 });
    return { user: payload };
  }
}

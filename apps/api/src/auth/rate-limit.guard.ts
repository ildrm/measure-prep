import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from "@nestjs/common";

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly attempts = new Map<string, { count: number; resetsAt: number }>();
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest(); const now = Date.now();
    const key = request.ip ?? request.socket?.remoteAddress ?? "unknown"; const current = this.attempts.get(key);
    const window = !current || current.resetsAt <= now ? { count: 0, resetsAt: now + 60000 } : current;
    window.count += 1; this.attempts.set(key, window);
    if (window.count > 30) throw new HttpException("Too many authentication requests. Try again in one minute.", HttpStatus.TOO_MANY_REQUESTS);
    if (this.attempts.size > 10000) for (const [ip, entry] of this.attempts) if (entry.resetsAt <= now) this.attempts.delete(ip);
    return true;
  }
}

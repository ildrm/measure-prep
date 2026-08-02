import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { Public } from "../auth/auth.decorators";
import { MailService } from "../auth/mail.service";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../sessions/redis.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService, private readonly redis: RedisService, private readonly mail: MailService) {}

  @Public() @Get("live")
  live() { return { status: "ok", timestamp: new Date().toISOString() }; }

  @Public() @Get("ready")
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      if (this.redis.client.status !== "ready" || await this.redis.client.ping() !== "PONG") throw new Error("Redis is unavailable");
      const email = await this.mail.verifyConnection();
      return { status: "ready", dependencies: { database: true, redis: true, email }, integrations: { aiScoringConfigured: Boolean(process.env.LLM_BASE_URL && process.env.LLM_API_KEY && process.env.LLM_MODEL), transcriptionConfigured: Boolean(process.env.STT_BASE_URL && process.env.STT_API_KEY && process.env.STT_MODEL) } };
    } catch (error) {
      throw new ServiceUnavailableException({ status: "not_ready", reason: error instanceof Error ? error.message : "Dependency check failed" });
    }
  }
}

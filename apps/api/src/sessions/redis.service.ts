import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  readonly client = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", { lazyConnect: true, maxRetriesPerRequest: 1, enableOfflineQueue: false });
  async onModuleInit() { try { await this.client.connect(); } catch { /* DB timestamps remain authoritative in degraded dev mode. */ } }
  async onModuleDestroy() { if (this.client.status === "ready") await this.client.quit(); }
  async setTimer(sessionId: string, sectionId: string, endsAt: Date) {
    if (this.client.status !== "ready") return;
    const ttl = Math.max(1, Math.ceil((endsAt.getTime() - Date.now()) / 1000));
    await this.client.set(`session:${sessionId}:timer`, JSON.stringify({ sectionId, endsAt: endsAt.toISOString() }), "EX", ttl);
  }
  async clearTimer(sessionId: string) { if (this.client.status === "ready") await this.client.del(`session:${sessionId}:timer`); }
}

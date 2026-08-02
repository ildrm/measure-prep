import { Module } from "@nestjs/common";
import { ScoringService } from "../scoring/scoring.service";
import { RedisService } from "./redis.service";
import { SessionsController } from "./sessions.controller";
import { SessionsService } from "./sessions.service";
import { MediaModule } from "../media/media.module";
@Module({ imports: [MediaModule], controllers: [SessionsController], providers: [SessionsService, RedisService, ScoringService], exports: [RedisService] })
export class SessionsModule {}

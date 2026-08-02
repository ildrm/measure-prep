import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api/v1");
  app.use(cookieParser());
  app.use((request: import("express").Request, response: import("express").Response, next: import("express").NextFunction) => {
    response.setHeader("X-Content-Type-Options", "nosniff"); response.setHeader("X-Frame-Options", "DENY"); response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin"); response.setHeader("Permissions-Policy", "camera=(), geolocation=()");
    const origin = request.headers.origin; const allowed = process.env.WEB_ORIGIN?.split(",") ?? ["http://localhost:3000"];
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method) && origin && !allowed.includes(origin)) return response.status(403).json({ message: "Request origin is not allowed." });
    next();
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.enableCors({ origin: process.env.WEB_ORIGIN?.split(",") ?? ["http://localhost:3000"], credentials: true });
  const config = new DocumentBuilder().setTitle("Exam Instrument API").setVersion("1.0").addCookieAuth("access_token").build();
  SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, config));
  await app.listen(Number(process.env.PORT ?? 3001), "0.0.0.0");
}
void bootstrap();

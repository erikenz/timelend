import "dotenv/config";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { getAllowedOrigins, getPort } from "./config/env";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    methods: ["GET", "HEAD", "OPTIONS", "POST"],
    origin: getAllowedOrigins(),
  });
  // biome-ignore lint/correctness/useHookAtTopLevel: NestJS `useGlobalPipes` is not a React hook.
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    })
  );

  const port = getPort();

  await app.listen(port);
}

bootstrap().catch((error: unknown) => {
  throw error;
});

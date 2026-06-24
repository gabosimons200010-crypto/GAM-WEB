import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import type { Env } from './config/env.validation';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(ConfigService<Env, true>);
  const logger = new Logger('Bootstrap');

  // Seguridad básica (RNF-SEC).
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: config.get('PUBLIC_WEB_URL', { infer: true }) ?? true,
    credentials: true,
  });

  // Prefijo y versionado del API público.
  app.setGlobalPrefix('api/v1');

  // Validación y saneo de entrada (RNF-SEC-004).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Documentación OpenAPI en /api/docs (RNF-MANT-003).
  const swaggerConfig = new DocumentBuilder()
    .setTitle('GAMARRA GO API')
    .setDescription('API del marketplace GAMARRA GO')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.get('PORT', { infer: true }) ?? 4000;
  await app.listen(port);
  logger.log(`GAMARRA GO API escuchando en http://localhost:${port}/api/v1`);
  logger.log(`OpenAPI en http://localhost:${port}/api/docs`);
}

void bootstrap();

import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

/**
 * Entrypoint del proceso worker (worker-media). Comparte la imagen Docker del
 * API con distinto comando. Consume colas BullMQ; no escucha HTTP.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(WorkerModule, { bufferLogs: false });
  app.enableShutdownHooks();
  const logger = new Logger('Worker');
  logger.log('worker-media arrancado — consumiendo cola "media"');
}

void bootstrap();

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from '../config/env.validation';
import { PrismaModule } from '../shared/prisma/prisma.module';
import { StorageModule } from '../shared/storage/storage.module';
import { QueueModule } from '../shared/queue/queue.module';
import { OutboxModule } from '../shared/events/outbox.module';
import { AuditModule } from '../shared/audit/audit.module';
import { AiWorkerModule } from '../modules/ai-cataloging/ai-worker.module';

/**
 * Raíz del proceso worker (worker-media). Carga la infraestructura compartida
 * (config, Prisma, almacenamiento, colas) y los consumidores de colas. No
 * expone HTTP. Se arranca con `pnpm dev:worker` / `node dist/workers/main.worker.js`.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    PrismaModule,
    StorageModule,
    QueueModule,
    OutboxModule, // AIDraftReady / ProductPublished
    AuditModule, // requerido por Seller (store.register), arrastrado vía Catalog
    AiWorkerModule,
    // Sprint 5: AiVisionWorkerModule (cola "ai")
    // Sprint posterior: NotifyWorkerModule (cola "notify")
  ],
})
export class WorkerModule {}

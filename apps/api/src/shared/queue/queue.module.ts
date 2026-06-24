import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation';

/**
 * Conexión BullMQ/Redis compartida (RNF-ESC-003: procesamiento asíncrono). La
 * conexión es perezosa y con cola offline, de modo que el API arranca aunque
 * Redis no esté disponible aún; los jobs se encolan cuando Redis vuelve.
 */
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const url = config.get('REDIS_URL', { infer: true }) ?? 'redis://localhost:6379';
        return {
          connection: {
            url,
            maxRetriesPerRequest: null, // requerido por BullMQ
            enableOfflineQueue: true,
            lazyConnect: true,
          },
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: 1000,
            removeOnFail: 5000,
          },
        };
      },
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}

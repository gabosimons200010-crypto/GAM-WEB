import { Global, Module } from '@nestjs/common';
import { OutboxPublisher } from './outbox';
import { PrismaOutboxPublisher } from './prisma-outbox';

@Global()
@Module({
  providers: [{ provide: OutboxPublisher, useClass: PrismaOutboxPublisher }],
  exports: [OutboxPublisher],
})
export class OutboxModule {}

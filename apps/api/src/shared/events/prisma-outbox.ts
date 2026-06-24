import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OutboxPublisher, DomainEvent } from './outbox';

@Injectable()
export class PrismaOutboxPublisher extends OutboxPublisher {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async publish(event: DomainEvent): Promise<void> {
    await this.prisma.outboxEvent.create({
      data: {
        aggregate: event.aggregate,
        aggregateId: event.aggregateId,
        type: event.type,
        version: event.version ?? 1,
        payload: event.payload as Prisma.InputJsonValue,
      },
    });
  }
}

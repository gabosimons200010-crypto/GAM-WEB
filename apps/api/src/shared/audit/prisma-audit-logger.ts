import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogger, AuditEntry } from './audit-logger';

@Injectable()
export class PrismaAuditLogger extends AuditLogger {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async log(entry: AuditEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        metadata: (entry.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        ip: entry.ip ?? null,
      },
    });
  }
}

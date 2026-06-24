import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  SessionRepository,
  SessionRecord,
  CreateSessionData,
} from '../application/ports/session.repository';

@Injectable()
export class PrismaSessionRepository extends SessionRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(data: CreateSessionData): Promise<SessionRecord> {
    const row = await this.prisma.session.create({
      data: {
        userId: data.userId,
        refreshHash: data.refreshHash,
        expiresAt: data.expiresAt,
        userAgent: data.userAgent ?? null,
        ip: data.ip ?? null,
      },
    });
    return this.toRecord(row);
  }

  async findById(id: string): Promise<SessionRecord | null> {
    const row = await this.prisma.session.findUnique({ where: { id } });
    return row ? this.toRecord(row) : null;
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.session.update({ where: { id }, data: { revokedAt: new Date() } });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private toRecord(row: {
    id: string;
    userId: string;
    refreshHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
  }): SessionRecord {
    return {
      id: row.id,
      userId: row.userId,
      refreshHash: row.refreshHash,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { VerificationPurpose } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  VerificationRepository,
  VerificationRecord,
  CreateVerificationData,
} from '../application/ports/verification.repository';

@Injectable()
export class PrismaVerificationRepository extends VerificationRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(data: CreateVerificationData): Promise<VerificationRecord> {
    const row = await this.prisma.verificationToken.create({
      data: {
        userId: data.userId ?? null,
        identifier: data.identifier,
        purpose: data.purpose,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      },
    });
    return row;
  }

  async findActive(
    identifier: string,
    purpose: VerificationPurpose,
  ): Promise<VerificationRecord | null> {
    return this.prisma.verificationToken.findFirst({
      where: {
        identifier,
        purpose,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async incrementAttempts(id: string): Promise<void> {
    await this.prisma.verificationToken.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
  }

  async consume(id: string): Promise<void> {
    await this.prisma.verificationToken.update({
      where: { id },
      data: { consumedAt: new Date() },
    });
  }

  async invalidateAll(identifier: string, purpose: VerificationPurpose): Promise<void> {
    await this.prisma.verificationToken.updateMany({
      where: { identifier, purpose, consumedAt: null },
      data: { consumedAt: new Date() },
    });
  }
}

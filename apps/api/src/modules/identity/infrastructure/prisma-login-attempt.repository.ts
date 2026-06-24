import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoginAttemptRepository } from '../application/ports/login-attempt.repository';

@Injectable()
export class PrismaLoginAttemptRepository extends LoginAttemptRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async record(identifier: string, success: boolean, ip?: string | null): Promise<void> {
    await this.prisma.loginAttempt.create({
      data: { identifier, success, ip: ip ?? null },
    });
  }

  async countRecentFailures(identifier: string, since: Date): Promise<number> {
    return this.prisma.loginAttempt.count({
      where: { identifier, success: false, createdAt: { gte: since } },
    });
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { VerificationPurpose } from '@prisma/client';
import { createHash } from 'node:crypto';
import { UserRepository } from '../ports/user.repository';
import { VerificationRepository } from '../ports/verification.repository';

@Injectable()
export class ConfirmEmailUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly verifications: VerificationRepository,
  ) {}

  async execute(email: string, token: string): Promise<void> {
    const record = await this.verifications.findActive(email, VerificationPurpose.EMAIL_CONFIRM);
    if (!record) {
      throw new BadRequestException('El enlace de confirmación es inválido o expiró');
    }
    const tokenHash = createHash('sha256').update(token).digest('hex');
    if (tokenHash !== record.tokenHash) {
      await this.verifications.incrementAttempts(record.id);
      throw new BadRequestException('El enlace de confirmación es inválido o expiró');
    }
    await this.verifications.consume(record.id);
    if (record.userId) {
      await this.users.markEmailVerified(record.userId);
    }
  }
}

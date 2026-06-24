import { BadRequestException, Injectable } from '@nestjs/common';
import { VerificationPurpose } from '@prisma/client';
import { createHash } from 'node:crypto';
import { UserRepository } from '../ports/user.repository';
import { VerificationRepository } from '../ports/verification.repository';
import { SessionRepository } from '../ports/session.repository';
import { PasswordHasher } from '../ports/password-hasher';

/**
 * Reset de contraseña (RF-AUTH-004): valida el token, exige que la nueva
 * contraseña sea distinta a la actual y revoca todas las sesiones.
 */
@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly verifications: VerificationRepository,
    private readonly sessions: SessionRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(email: string, token: string, newPassword: string): Promise<void> {
    const identifier = email.toLowerCase();
    const record = await this.verifications.findActive(
      identifier,
      VerificationPurpose.PASSWORD_RESET,
    );
    if (!record) {
      throw new BadRequestException('El enlace es inválido o expiró');
    }
    const tokenHash = createHash('sha256').update(token).digest('hex');
    if (tokenHash !== record.tokenHash) {
      await this.verifications.incrementAttempts(record.id);
      throw new BadRequestException('El enlace es inválido o expiró');
    }

    const user = await this.users.findByEmail(identifier);
    if (!user) {
      throw new BadRequestException('El enlace es inválido o expiró');
    }
    if (user.passwordHash && (await this.hasher.compare(newPassword, user.passwordHash))) {
      throw new BadRequestException('La nueva contraseña debe ser distinta a la anterior');
    }

    const passwordHash = await this.hasher.hash(newPassword);
    await this.users.setPassword(user.id, passwordHash);
    await this.verifications.consume(record.id);
    await this.sessions.revokeAllForUser(user.id); // invalida sesiones activas
  }
}

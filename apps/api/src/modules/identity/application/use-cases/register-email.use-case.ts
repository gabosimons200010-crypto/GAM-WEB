import { ConflictException, Injectable } from '@nestjs/common';
import { RoleName, VerificationPurpose } from '@prisma/client';
import { randomBytes, createHash } from 'node:crypto';
import { UserRepository } from '../ports/user.repository';
import { PasswordHasher } from '../ports/password-hasher';
import { VerificationRepository } from '../ports/verification.repository';
import { CodeDelivery } from '../ports/code-delivery';

const EMAIL_CONFIRM_TTL_MS = 24 * 60 * 60 * 1000; // RF-AUTH-001: enlace válido 24 h

export interface RegisterEmailInput {
  email: string;
  password: string;
  fullName?: string;
}

@Injectable()
export class RegisterEmailUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly verifications: VerificationRepository,
    private readonly delivery: CodeDelivery,
  ) {}

  async execute(input: RegisterEmailInput): Promise<{ userId: string; status: string }> {
    const existing = await this.users.findByEmail(input.email);
    if (existing) {
      throw new ConflictException('Ya existe una cuenta con ese correo');
    }

    const passwordHash = await this.hasher.hash(input.password);
    const user = await this.users.create({
      email: input.email,
      passwordHash,
      fullName: input.fullName ?? null,
    });
    await this.users.assignRole(user.id, RoleName.COMPRADOR);

    // Token de confirmación de email (se guarda el hash; se envía el valor en claro).
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await this.verifications.create({
      userId: user.id,
      identifier: input.email,
      purpose: VerificationPurpose.EMAIL_CONFIRM,
      tokenHash,
      expiresAt: new Date(Date.now() + EMAIL_CONFIRM_TTL_MS),
    });
    await this.delivery.sendEmailConfirmation(input.email, token);

    return { userId: user.id, status: 'PENDING' };
  }
}

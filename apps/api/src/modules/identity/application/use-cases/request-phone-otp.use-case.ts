import { Injectable } from '@nestjs/common';
import { VerificationPurpose } from '@prisma/client';
import { createHash, randomInt } from 'node:crypto';
import { UserRepository } from '../ports/user.repository';
import { VerificationRepository } from '../ports/verification.repository';
import { CodeDelivery } from '../ports/code-delivery';

const OTP_TTL_MS = 5 * 60 * 1000; // RF-AUTH-002: OTP válido 5 min

/**
 * Registro/acceso por celular (RF-AUTH-002): genera un OTP de 6 dígitos y lo
 * "envía" por SMS (en MVP, log). Si el usuario no existe se crea como PENDING.
 */
@Injectable()
export class RequestPhoneOtpUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly verifications: VerificationRepository,
    private readonly delivery: CodeDelivery,
  ) {}

  async execute(phone: string): Promise<void> {
    let user = await this.users.findByPhone(phone);
    if (!user) {
      user = await this.users.create({ phone });
    }

    await this.verifications.invalidateAll(phone, VerificationPurpose.PHONE_OTP);

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const tokenHash = createHash('sha256').update(code).digest('hex');
    await this.verifications.create({
      userId: user.id,
      identifier: phone,
      purpose: VerificationPurpose.PHONE_OTP,
      tokenHash,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });
    await this.delivery.sendPhoneOtp(phone, code);
  }
}

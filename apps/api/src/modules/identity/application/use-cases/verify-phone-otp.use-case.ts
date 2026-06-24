import { BadRequestException, Injectable } from '@nestjs/common';
import { RoleName, VerificationPurpose } from '@prisma/client';
import { createHash } from 'node:crypto';
import { UserRepository } from '../ports/user.repository';
import { VerificationRepository } from '../ports/verification.repository';
import { SessionRepository } from '../ports/session.repository';
import { TokenService } from '../ports/token-service';
import { AuthUser } from '../../domain/auth-user';
import { LoginResult } from './login.use-case';

const MAX_OTP_ATTEMPTS = 3; // RF-AUTH-002: 3 intentos fallidos bloquean

@Injectable()
export class VerifyPhoneOtpUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly verifications: VerificationRepository,
    private readonly sessions: SessionRepository,
    private readonly tokens: TokenService,
  ) {}

  async execute(phone: string, code: string): Promise<LoginResult> {
    const record = await this.verifications.findActive(phone, VerificationPurpose.PHONE_OTP);
    if (!record) {
      throw new BadRequestException('El código es inválido o expiró');
    }
    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      throw new BadRequestException('Demasiados intentos. Solicita un nuevo código.');
    }

    const codeHash = createHash('sha256').update(code).digest('hex');
    if (codeHash !== record.tokenHash) {
      await this.verifications.incrementAttempts(record.id);
      throw new BadRequestException('El código es inválido o expiró');
    }

    await this.verifications.consume(record.id);

    const user = await this.users.findByPhone(phone);
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }
    await this.users.markPhoneVerified(user.id);
    if (!user.roles.includes(RoleName.COMPRADOR)) {
      await this.users.assignRole(user.id, RoleName.COMPRADOR);
      user.roles.push(RoleName.COMPRADOR);
    }

    // Auto-login tras verificar.
    const payload: AuthUser = { sub: user.id, roles: user.roles, stores: user.storeIds };
    const accessToken = this.tokens.signAccess(payload);
    const refresh = this.tokens.newRefresh();
    const refreshTtl = this.tokens.refreshTtlSeconds();
    const session = await this.sessions.create({
      userId: user.id,
      refreshHash: refresh.hash,
      expiresAt: new Date(Date.now() + refreshTtl * 1000),
    });

    return {
      accessToken,
      refreshToken: `${session.id}.${refresh.raw}`,
      expiresIn: this.tokens.accessTtlSeconds(),
      refreshExpiresIn: refreshTtl,
      user: { ...payload, email: user.email },
    };
  }
}

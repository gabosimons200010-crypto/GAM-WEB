import { Injectable } from '@nestjs/common';
import { VerificationPurpose } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { UserRepository } from '../ports/user.repository';
import { VerificationRepository } from '../ports/verification.repository';
import { CodeDelivery } from '../ports/code-delivery';

const RESET_TTL_MS = 15 * 60 * 1000; // RF-AUTH-004: enlace válido 15 min

/**
 * Solicitud de reset (RF-AUTH-004). Responde siempre igual exista o no la
 * cuenta, para no permitir enumeración de usuarios.
 */
@Injectable()
export class RequestPasswordResetUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly verifications: VerificationRepository,
    private readonly delivery: CodeDelivery,
  ) {}

  /**
   * Devuelve el token generado (o null si la cuenta no existe). El controlador
   * lo expone SOLO fuera de producción para poder demostrar el flujo sin correo;
   * en producción la respuesta es uniforme y nunca revela el token ni si existe.
   */
  async execute(email: string): Promise<string | null> {
    const identifier = email.toLowerCase();
    const user = await this.users.findByEmail(identifier);
    if (!user) {
      return null; // silencioso: no revelar si existe
    }

    await this.verifications.invalidateAll(identifier, VerificationPurpose.PASSWORD_RESET);
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await this.verifications.create({
      userId: user.id,
      identifier,
      purpose: VerificationPurpose.PASSWORD_RESET,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
    });
    await this.delivery.sendPasswordReset(identifier, token);
    return token;
  }
}

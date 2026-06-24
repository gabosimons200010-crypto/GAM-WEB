import { Injectable } from '@nestjs/common';
import { SessionRepository } from '../ports/session.repository';

/**
 * Cierre de sesión server-side (RF-AUTH-005): no basta con borrar la cookie,
 * la sesión (refresh) se revoca en el servidor.
 */
@Injectable()
export class LogoutUseCase {
  constructor(private readonly sessions: SessionRepository) {}

  async execute(cookieValue: string | undefined): Promise<void> {
    if (!cookieValue) return;
    const idx = cookieValue.indexOf('.');
    const sessionId = idx > 0 ? cookieValue.slice(0, idx) : cookieValue;
    const session = await this.sessions.findById(sessionId);
    if (session && !session.revokedAt) {
      await this.sessions.revoke(session.id);
    }
  }
}

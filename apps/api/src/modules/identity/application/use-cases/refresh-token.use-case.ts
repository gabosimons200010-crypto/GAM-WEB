import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from '../ports/user.repository';
import { SessionRepository } from '../ports/session.repository';
import { TokenService } from '../ports/token-service';
import { AuthUser } from '../../domain/auth-user';
import { LoginResult } from './login.use-case';

/**
 * Rota el refresh token (RNF-SEC-003): valida la sesión, la revoca y emite una
 * nueva. La cookie tiene formato `sessionId.secreto`.
 */
@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly tokens: TokenService,
  ) {}

  async execute(cookieValue: string | undefined): Promise<LoginResult> {
    const parsed = this.parse(cookieValue);
    if (!parsed) {
      throw new UnauthorizedException('Sesión inválida');
    }

    const session = await this.sessions.findById(parsed.sessionId);
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt.getTime() < Date.now() ||
      this.tokens.hashRefresh(parsed.secret) !== session.refreshHash
    ) {
      throw new UnauthorizedException('Sesión inválida o expirada');
    }

    // Rotación: revoca la sesión usada y crea una nueva.
    await this.sessions.revoke(session.id);

    const user = await this.users.findById(session.userId);
    if (!user || user.status === 'BLOCKED' || user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Cuenta no disponible');
    }

    const payload: AuthUser = { sub: user.id, roles: user.roles, stores: user.storeIds };
    const accessToken = this.tokens.signAccess(payload);
    const refresh = this.tokens.newRefresh();
    const refreshTtl = this.tokens.refreshTtlSeconds();
    const newSession = await this.sessions.create({
      userId: user.id,
      refreshHash: refresh.hash,
      expiresAt: new Date(Date.now() + refreshTtl * 1000),
    });

    return {
      accessToken,
      refreshToken: `${newSession.id}.${refresh.raw}`,
      expiresIn: this.tokens.accessTtlSeconds(),
      refreshExpiresIn: refreshTtl,
      user: { ...payload, email: user.email },
    };
  }

  private parse(cookieValue?: string): { sessionId: string; secret: string } | null {
    if (!cookieValue) return null;
    const idx = cookieValue.indexOf('.');
    if (idx <= 0) return null;
    return { sessionId: cookieValue.slice(0, idx), secret: cookieValue.slice(idx + 1) };
  }
}

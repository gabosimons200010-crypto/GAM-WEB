import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRepository } from '../ports/user.repository';
import { PasswordHasher } from '../ports/password-hasher';
import { LoginAttemptRepository } from '../ports/login-attempt.repository';
import { SessionRepository } from '../ports/session.repository';
import { TokenService } from '../ports/token-service';
import { AuthUser } from '../../domain/auth-user';

const MAX_FAILURES = 5; // RF-AUTH-007
const LOCK_WINDOW_MS = 15 * 60 * 1000; // 15 min

export interface LoginInput {
  email: string;
  password: string;
  ip?: string | null;
  userAgent?: string | null;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string; // valor en claro para la cookie HttpOnly
  expiresIn: number;
  refreshExpiresIn: number;
  user: AuthUser & { email: string | null };
}

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly attempts: LoginAttemptRepository,
    private readonly sessions: SessionRepository,
    private readonly tokens: TokenService,
  ) {}

  async execute(input: LoginInput): Promise<LoginResult> {
    const identifier = input.email.toLowerCase();

    // Bloqueo por fuerza bruta (RF-AUTH-007 / RNF-SEC-006).
    const since = new Date(Date.now() - LOCK_WINDOW_MS);
    const failures = await this.attempts.countRecentFailures(identifier, since);
    if (failures >= MAX_FAILURES) {
      throw new ForbiddenException(
        'Demasiados intentos fallidos. Intenta de nuevo en unos minutos.',
      );
    }

    const user = await this.users.findByEmail(identifier);
    const ok = user?.passwordHash
      ? await this.hasher.compare(input.password, user.passwordHash)
      : false;

    if (!user || !ok) {
      await this.attempts.record(identifier, false, input.ip);
      // Mensaje genérico: no revelar si el correo existe.
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    if (user.status === 'BLOCKED' || user.status === 'SUSPENDED') {
      throw new ForbiddenException('La cuenta está deshabilitada');
    }

    await this.attempts.record(identifier, true, input.ip);

    const payload: AuthUser = {
      sub: user.id,
      roles: user.roles,
      stores: user.storeIds,
    };
    const accessToken = this.tokens.signAccess(payload);
    const refresh = this.tokens.newRefresh();
    const refreshTtl = this.tokens.refreshTtlSeconds();
    const session = await this.sessions.create({
      userId: user.id,
      refreshHash: refresh.hash,
      expiresAt: new Date(Date.now() + refreshTtl * 1000),
      ip: input.ip,
      userAgent: input.userAgent,
    });

    return {
      accessToken,
      // La cookie lleva sessionId.secreto para poder ubicar la sesión al refrescar.
      refreshToken: `${session.id}.${refresh.raw}`,
      expiresIn: this.tokens.accessTtlSeconds(),
      refreshExpiresIn: refreshTtl,
      user: { ...payload, email: user.email },
    };
  }
}

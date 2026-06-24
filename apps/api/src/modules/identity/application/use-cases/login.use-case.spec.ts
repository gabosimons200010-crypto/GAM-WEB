import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { LoginUseCase } from './login.use-case';
import { UserRepository, CreateUserData } from '../ports/user.repository';
import { PasswordHasher } from '../ports/password-hasher';
import { LoginAttemptRepository } from '../ports/login-attempt.repository';
import { SessionRepository, CreateSessionData, SessionRecord } from '../ports/session.repository';
import { TokenService, RefreshToken } from '../ports/token-service';
import { AuthUser, IdentityUser } from '../../domain/auth-user';

// ── Fakes en memoria (sin Prisma ni Nest) ──

class FakeUsers extends UserRepository {
  constructor(private readonly users: IdentityUser[]) {
    super();
  }
  async findById(id: string) {
    return this.users.find((u) => u.id === id) ?? null;
  }
  async findByEmail(email: string) {
    return this.users.find((u) => u.email === email) ?? null;
  }
  async findByPhone() {
    return null;
  }
  async create(_d: CreateUserData): Promise<IdentityUser> {
    throw new Error('no usado');
  }
  async assignRole() {}
  async setPassword() {}
  async markEmailVerified() {}
  async markPhoneVerified() {}
}

class FakeHasher extends PasswordHasher {
  async hash(p: string) {
    return `hashed:${p}`;
  }
  async compare(plain: string, hash: string) {
    return `hashed:${plain}` === hash;
  }
}

class FakeAttempts extends LoginAttemptRepository {
  public failures = 0;
  public recorded: boolean[] = [];
  async record(_id: string, success: boolean) {
    this.recorded.push(success);
  }
  async countRecentFailures() {
    return this.failures;
  }
}

class FakeSessions extends SessionRepository {
  async create(d: CreateSessionData): Promise<SessionRecord> {
    return { id: 'sess_1', userId: d.userId, refreshHash: d.refreshHash, expiresAt: d.expiresAt, revokedAt: null };
  }
  async findById() {
    return null;
  }
  async revoke() {}
  async revokeAllForUser() {}
}

class FakeTokens extends TokenService {
  signAccess(p: AuthUser) {
    return `access.${p.sub}`;
  }
  verifyAccess(): AuthUser {
    throw new Error('no usado');
  }
  newRefresh(): RefreshToken {
    return { raw: 'raw', hash: 'hash' };
  }
  hashRefresh() {
    return 'hash';
  }
  accessTtlSeconds() {
    return 900;
  }
  refreshTtlSeconds() {
    return 2_592_000;
  }
}

function buildUser(): IdentityUser {
  return {
    id: 'u1',
    email: 'a@b.com',
    phone: null,
    passwordHash: 'hashed:Secreta123',
    fullName: 'A',
    status: 'ACTIVE',
    emailVerified: new Date(),
    phoneVerified: null,
    roles: [RoleName.COMPRADOR],
    storeIds: [],
  };
}

describe('LoginUseCase', () => {
  let attempts: FakeAttempts;
  let useCase: LoginUseCase;

  beforeEach(() => {
    attempts = new FakeAttempts();
    useCase = new LoginUseCase(
      new FakeUsers([buildUser()]),
      new FakeHasher(),
      attempts,
      new FakeSessions(),
      new FakeTokens(),
    );
  });

  it('autentica con credenciales correctas y emite tokens', async () => {
    const res = await useCase.execute({ email: 'a@b.com', password: 'Secreta123' });
    expect(res.accessToken).toBe('access.u1');
    expect(res.refreshToken).toBe('sess_1.raw');
    expect(res.user.roles).toContain(RoleName.COMPRADOR);
    expect(attempts.recorded).toContain(true);
  });

  it('rechaza contraseña incorrecta y registra el intento fallido', async () => {
    await expect(useCase.execute({ email: 'a@b.com', password: 'mala' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(attempts.recorded).toContain(false);
  });

  it('bloquea tras 5 intentos fallidos (RF-AUTH-007)', async () => {
    attempts.failures = 5;
    await expect(
      useCase.execute({ email: 'a@b.com', password: 'Secreta123' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('no revela si el correo existe (mensaje genérico)', async () => {
    await expect(
      useCase.execute({ email: 'noexiste@b.com', password: 'x' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

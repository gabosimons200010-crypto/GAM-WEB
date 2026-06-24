import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import { TokenService, RefreshToken } from '../application/ports/token-service';
import { AuthUser } from '../domain/auth-user';
import type { Env } from '../../../config/env.validation';

@Injectable()
export class JwtTokenService extends TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {
    super();
  }

  signAccess(payload: AuthUser): string {
    return this.jwt.sign(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      expiresIn: this.accessTtlSeconds(),
    });
  }

  verifyAccess(token: string): AuthUser {
    try {
      return this.jwt.verify<AuthUser>(token, {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      });
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  newRefresh(): RefreshToken {
    const raw = randomBytes(48).toString('hex');
    return { raw, hash: this.hashRefresh(raw) };
  }

  hashRefresh(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  accessTtlSeconds(): number {
    return this.config.get('JWT_ACCESS_TTL', { infer: true });
  }

  refreshTtlSeconds(): number {
    return this.config.get('JWT_REFRESH_TTL', { infer: true });
  }
}

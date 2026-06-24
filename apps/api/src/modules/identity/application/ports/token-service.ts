import { AuthUser } from '../../domain/auth-user';

export interface RefreshToken {
  /** valor en claro que viaja en la cookie HttpOnly */
  raw: string;
  /** hash que se persiste en Session.refreshHash */
  hash: string;
}

/**
 * Puerto de emisión/verificación de tokens.
 * - Access token: JWT firmado, 15 min (RNF-SEC-003).
 * - Refresh token: opaco de alta entropía, rotativo; solo se guarda su hash.
 */
export abstract class TokenService {
  abstract signAccess(payload: AuthUser): string;
  abstract verifyAccess(token: string): AuthUser;
  abstract newRefresh(): RefreshToken;
  abstract hashRefresh(raw: string): string;
  abstract accessTtlSeconds(): number;
  abstract refreshTtlSeconds(): number;
}

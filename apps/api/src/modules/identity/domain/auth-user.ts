import { RoleName } from '@prisma/client';

/**
 * Identidad del actor autenticado, derivada del access token. Es lo que los
 * guards adjuntan al request y los controladores consumen vía @CurrentUser().
 */
export interface AuthUser {
  /** id del usuario (sub del JWT) */
  sub: string;
  roles: RoleName[];
  /** ids de tiendas a las que pertenece (scope multi-tenant, RF-AUTH-006) */
  stores: string[];
}

export interface IdentityUser {
  id: string;
  email: string | null;
  phone: string | null;
  passwordHash: string | null;
  fullName: string | null;
  status: 'PENDING' | 'ACTIVE' | 'BLOCKED' | 'SUSPENDED';
  emailVerified: Date | null;
  phoneVerified: Date | null;
  roles: RoleName[];
  storeIds: string[];
}

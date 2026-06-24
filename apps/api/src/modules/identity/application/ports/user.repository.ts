import { RoleName } from '@prisma/client';
import { IdentityUser } from '../../domain/auth-user';

export interface CreateUserData {
  email?: string | null;
  phone?: string | null;
  passwordHash?: string | null;
  fullName?: string | null;
}

export abstract class UserRepository {
  abstract findById(id: string): Promise<IdentityUser | null>;
  abstract findByEmail(email: string): Promise<IdentityUser | null>;
  abstract findByPhone(phone: string): Promise<IdentityUser | null>;
  abstract create(data: CreateUserData): Promise<IdentityUser>;
  abstract assignRole(userId: string, role: RoleName): Promise<void>;
  abstract setPassword(userId: string, passwordHash: string): Promise<void>;
  abstract markEmailVerified(userId: string): Promise<void>;
  abstract markPhoneVerified(userId: string): Promise<void>;
}

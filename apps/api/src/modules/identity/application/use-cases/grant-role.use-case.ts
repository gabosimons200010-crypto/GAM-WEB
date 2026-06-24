import { Injectable } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { UserRepository } from '../ports/user.repository';

/**
 * Otorga un rol global a un usuario. Se expone para que otros contextos
 * (p.ej. Seller, al registrar una tienda → rol VENDEDOR) no escriban
 * directamente en las tablas de Identity (regla de frontera, docs/01 §1.4).
 */
@Injectable()
export class GrantRoleUseCase {
  constructor(private readonly users: UserRepository) {}

  execute(userId: string, role: RoleName): Promise<void> {
    return this.users.assignRole(userId, role);
  }
}

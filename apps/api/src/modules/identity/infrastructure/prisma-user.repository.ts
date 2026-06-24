import { Injectable } from '@nestjs/common';
import { Prisma, RoleName } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { UserRepository, CreateUserData } from '../application/ports/user.repository';
import { IdentityUser } from '../domain/auth-user';

const userInclude = {
  roles: { include: { role: true } },
  memberships: true,
} satisfies Prisma.UserInclude;

type UserWithRelations = Prisma.UserGetPayload<{ include: typeof userInclude }>;

@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<IdentityUser | null> {
    const row = await this.prisma.user.findUnique({ where: { id }, include: userInclude });
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<IdentityUser | null> {
    const row = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: userInclude,
    });
    return row ? this.toDomain(row) : null;
  }

  async findByPhone(phone: string): Promise<IdentityUser | null> {
    const row = await this.prisma.user.findUnique({ where: { phone }, include: userInclude });
    return row ? this.toDomain(row) : null;
  }

  async create(data: CreateUserData): Promise<IdentityUser> {
    const row = await this.prisma.user.create({
      data: {
        email: data.email ? data.email.toLowerCase() : null,
        phone: data.phone ?? null,
        passwordHash: data.passwordHash ?? null,
        fullName: data.fullName ?? null,
      },
      include: userInclude,
    });
    return this.toDomain(row);
  }

  async assignRole(userId: string, role: RoleName): Promise<void> {
    const roleRow = await this.prisma.role.findUnique({ where: { name: role } });
    if (!roleRow) return;
    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: roleRow.id } },
      update: {},
      create: { userId, roleId: roleRow.id },
    });
  }

  async setPassword(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerified: new Date(), status: 'ACTIVE' },
    });
  }

  async markPhoneVerified(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { phoneVerified: new Date(), status: 'ACTIVE' },
    });
  }

  private toDomain(row: UserWithRelations): IdentityUser {
    return {
      id: row.id,
      email: row.email,
      phone: row.phone,
      passwordHash: row.passwordHash,
      fullName: row.fullName,
      status: row.status,
      emailVerified: row.emailVerified,
      phoneVerified: row.phoneVerified,
      roles: row.roles.map((r) => r.role.name),
      storeIds: row.memberships.map((m) => m.storeId),
    };
  }
}

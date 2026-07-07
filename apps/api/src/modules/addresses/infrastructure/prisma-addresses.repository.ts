import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { AddressesRepository, AddressView, CreateAddressData } from '../application/ports/addresses.repository';

@Injectable()
export class PrismaAddressesRepository extends AddressesRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listForUser(userId: string): Promise<AddressView[]> {
    const rows = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { id: 'desc' }],
    });
    return rows.map(this.toView);
  }

  async create(userId: string, data: CreateAddressData): Promise<AddressView> {
    const row = await this.prisma.$transaction(async (tx) => {
      const count = await tx.address.count({ where: { userId } });
      const makeDefault = data.isDefault || count === 0; // la primera es la predeterminada
      if (makeDefault) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
      return tx.address.create({
        data: {
          userId,
          department: data.department,
          province: data.province,
          district: data.district,
          line: data.line,
          reference: data.reference ?? null,
          phone: data.phone ?? null,
          isDefault: makeDefault,
        },
      });
    });
    return this.toView(row);
  }

  async remove(userId: string, addressId: string): Promise<void> {
    await this.prisma.address.deleteMany({ where: { id: addressId, userId } });
  }

  async setDefault(userId: string, addressId: string): Promise<AddressView | null> {
    const owned = await this.prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!owned) return null;
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
      return tx.address.update({ where: { id: addressId }, data: { isDefault: true } });
    });
    return this.toView(row);
  }

  private toView(r: {
    id: string;
    department: string;
    province: string;
    district: string;
    line: string;
    reference: string | null;
    phone: string | null;
    isDefault: boolean;
  }): AddressView {
    return {
      id: r.id,
      department: r.department,
      province: r.province,
      district: r.district,
      line: r.line,
      reference: r.reference,
      phone: r.phone,
      isDefault: r.isDefault,
    };
  }
}

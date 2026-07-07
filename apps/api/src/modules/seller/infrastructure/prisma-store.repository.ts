import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  StoreRepository,
  RegisterStoreData,
  UpdateStoreData,
  UpdateSettingsData,
  ListStoresFilter,
} from '../application/ports/store.repository';
import { StoreStatus, StoreView, StoreSettingsView } from '../domain/store';

const storeInclude = {
  socials: true,
  categories: true,
} satisfies Prisma.StoreInclude;

type StoreRow = Prisma.StoreGetPayload<{ include: typeof storeInclude }>;

@Injectable()
export class PrismaStoreRepository extends StoreRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async slugExists(slug: string): Promise<boolean> {
    const count = await this.prisma.store.count({ where: { slug } });
    return count > 0;
  }

  async register(data: RegisterStoreData): Promise<StoreView> {
    const row = await this.prisma.store.create({
      data: {
        slug: data.slug,
        commercialName: data.commercialName,
        legalName: data.legalName ?? null,
        ruc: data.ruc ?? null,
        contactName: data.contactName ?? null,
        email: data.email,
        phone: data.phone,
        galleryId: data.galleryId ?? null,
        floor: data.floor ?? null,
        stand: data.stand ?? null,
        address: data.address ?? null,
        status: 'IN_REVIEW',
        memberships: {
          create: { userId: data.ownerUserId, storeRole: 'ADMIN_TIENDA' },
        },
        categories: data.categoryIds?.length
          ? { create: data.categoryIds.map((categoryId) => ({ categoryId })) }
          : undefined,
        settings: { create: {} }, // valores por defecto (RF-SHOP-010)
      },
      include: storeInclude,
    });
    return this.toView(row);
  }

  async findById(id: string): Promise<StoreView | null> {
    const row = await this.prisma.store.findUnique({ where: { id }, include: storeInclude });
    return row ? this.toView(row) : null;
  }

  async findBySlug(slug: string): Promise<StoreView | null> {
    const row = await this.prisma.store.findUnique({ where: { slug }, include: storeInclude });
    return row ? this.toView(row) : null;
  }

  async findByOwner(userId: string): Promise<StoreView[]> {
    const rows = await this.prisma.store.findMany({
      where: { memberships: { some: { userId } } },
      include: storeInclude,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toView(r));
  }

  async userOwnsStore(userId: string, storeId: string): Promise<boolean> {
    const count = await this.prisma.membership.count({ where: { userId, storeId } });
    return count > 0;
  }

  async update(storeId: string, data: UpdateStoreData): Promise<StoreView> {
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.store.update({
        where: { id: storeId },
        data: {
          logoUrl: data.logoUrl ?? undefined,
          bannerUrl: data.bannerUrl ?? undefined,
          description: data.description ?? undefined,
        },
      });

      if (data.socials) {
        await tx.storeSocial.deleteMany({ where: { storeId } });
        if (data.socials.length) {
          await tx.storeSocial.createMany({
            data: data.socials.map((s) => ({ storeId, platform: s.platform, url: s.url })),
          });
        }
      }

      if (data.categoryIds) {
        await tx.storeCategory.deleteMany({ where: { storeId } });
        if (data.categoryIds.length) {
          await tx.storeCategory.createMany({
            data: data.categoryIds.map((categoryId) => ({ storeId, categoryId })),
          });
        }
      }

      return tx.store.findUniqueOrThrow({ where: { id: storeId }, include: storeInclude });
    });
    return this.toView(row);
  }

  async getSettings(storeId: string): Promise<StoreSettingsView | null> {
    const row = await this.prisma.storeSettings.findUnique({ where: { storeId } });
    return row ? this.toSettings(row) : null;
  }

  async upsertSettings(storeId: string, data: UpdateSettingsData): Promise<StoreSettingsView> {
    const schedule = data.schedule as Prisma.InputJsonValue | undefined;
    const row = await this.prisma.storeSettings.upsert({
      where: { storeId },
      create: {
        storeId,
        schedule,
        preparationDays: data.preparationDays ?? 2,
        returnPolicy: data.returnPolicy ?? null,
        lowStockThreshold: data.lowStockThreshold ?? 5,
      },
      update: {
        schedule,
        preparationDays: data.preparationDays ?? undefined,
        returnPolicy: data.returnPolicy ?? undefined,
        lowStockThreshold: data.lowStockThreshold ?? undefined,
      },
    });
    return this.toSettings(row);
  }

  async setStatus(storeId: string, status: StoreStatus): Promise<void> {
    await this.prisma.store.update({
      where: { id: storeId },
      data: {
        status,
        approvedAt: status === 'APPROVED' ? new Date() : undefined,
      },
    });
  }

  async setVerified(storeId: string, verified: boolean): Promise<void> {
    await this.prisma.store.update({ where: { id: storeId }, data: { verified } });
  }

  async list(filter: ListStoresFilter): Promise<{ items: StoreView[]; nextCursor: string | null }> {
    const where: Prisma.StoreWhereInput = {
      status: filter.status,
      commercialName: filter.query
        ? { contains: filter.query, mode: 'insensitive' }
        : undefined,
    };
    const rows = await this.prisma.store.findMany({
      where,
      include: storeInclude,
      orderBy: { createdAt: 'desc' },
      take: filter.limit + 1,
      ...(filter.cursor ? { cursor: { id: filter.cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > filter.limit;
    const page = hasMore ? rows.slice(0, filter.limit) : rows;
    return {
      items: page.map((r) => this.toView(r)),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    };
  }

  private toView(row: StoreRow): StoreView {
    return {
      id: row.id,
      slug: row.slug,
      commercialName: row.commercialName,
      legalName: row.legalName,
      ruc: row.ruc,
      contactName: row.contactName,
      email: row.email,
      phone: row.phone,
      galleryId: row.galleryId,
      floor: row.floor,
      stand: row.stand,
      address: row.address,
      logoUrl: row.logoUrl,
      bannerUrl: row.bannerUrl,
      description: row.description,
      status: row.status,
      verified: row.verified,
      rating: Number(row.rating),
      salesCount: row.salesCount,
      createdAt: row.createdAt,
      socials: row.socials.map((s) => ({ platform: s.platform, url: s.url })),
      categoryIds: row.categories.map((c) => c.categoryId),
    };
  }

  private toSettings(row: {
    storeId: string;
    schedule: Prisma.JsonValue | null;
    preparationDays: number;
    returnPolicy: string | null;
    lowStockThreshold: number;
  }): StoreSettingsView {
    return {
      storeId: row.storeId,
      schedule: row.schedule ?? null,
      preparationDays: row.preparationDays,
      returnPolicy: row.returnPolicy,
      lowStockThreshold: row.lowStockThreshold,
    };
  }
}

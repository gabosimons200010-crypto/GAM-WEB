import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { FavoritesRepository, FavoriteProductView } from '../application/ports/favorites.repository';

const favoriteInclude = {
  product: {
    include: {
      store: { select: { commercialName: true, slug: true } },
      media: { orderBy: { position: 'asc' }, take: 1 },
    },
  },
} satisfies Prisma.FavoriteInclude;

type FavoriteRow = Prisma.FavoriteGetPayload<{ include: typeof favoriteInclude }>;

@Injectable()
export class PrismaFavoritesRepository extends FavoritesRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async add(userId: string, productId: string): Promise<void> {
    await this.prisma.favorite.upsert({
      where: { userId_productId: { userId, productId } },
      update: {},
      create: { userId, productId },
    });
  }

  async remove(userId: string, productId: string): Promise<void> {
    await this.prisma.favorite.deleteMany({ where: { userId, productId } });
  }

  async listProducts(userId: string): Promise<FavoriteProductView[]> {
    const rows = await this.prisma.favorite.findMany({
      where: { userId, product: { status: 'ACTIVE' } },
      orderBy: { createdAt: 'desc' },
      include: favoriteInclude,
    });
    return rows.map((r: FavoriteRow) => ({
      id: r.product.id,
      slug: r.product.slug,
      name: r.product.name,
      price: Number(r.product.price),
      salePrice: r.product.salePrice !== null ? Number(r.product.salePrice) : null,
      thumbnailUrl: r.product.media[0]?.url ?? null,
      storeName: r.product.store.commercialName,
      storeSlug: r.product.store.slug,
    }));
  }

  async listIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.favorite.findMany({ where: { userId }, select: { productId: true } });
    return rows.map((r) => r.productId);
  }
}

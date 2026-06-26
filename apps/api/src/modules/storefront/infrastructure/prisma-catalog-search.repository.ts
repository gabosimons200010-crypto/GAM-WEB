import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CatalogSearchPort } from '../application/ports/catalog-search.port';
import { ProductCard, SearchFilters, SearchResult, SortOption } from '../domain/search';

const cardInclude = {
  store: { select: { commercialName: true, slug: true } },
  media: { orderBy: { position: 'asc' }, take: 1 },
} satisfies Prisma.ProductInclude;

type CardRow = Prisma.ProductGetPayload<{ include: typeof cardInclude }>;

/**
 * Búsqueda del catálogo sobre PostgreSQL (Fase 2). Filtra por categoría,
 * género y rango de precio; el texto libre usa ILIKE sobre nombre/descripción
 * y coincidencia exacta de tag. Solo productos ACTIVE de tiendas APPROVED.
 * Paginación por offset (page/pageSize) con conteo total para la grilla.
 */
@Injectable()
export class PrismaCatalogSearchRepository extends CatalogSearchPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async search(filters: SearchFilters): Promise<SearchResult> {
    const where = this.buildWhere(filters);
    const skip = (filters.page - 1) * filters.pageSize;

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: cardInclude,
        orderBy: this.buildOrderBy(filters.sort),
        skip,
        take: filters.pageSize,
      }),
    ]);

    return {
      items: rows.map((r) => this.toCard(r)),
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      hasMore: skip + rows.length < total,
    };
  }

  private buildWhere(filters: SearchFilters): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {
      status: 'ACTIVE',
      archivedAt: null,
      store: { status: 'APPROVED' },
    };
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.gender) where.gender = filters.gender;
    if (filters.storeId) where.storeId = filters.storeId;

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {
        ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
        ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
      };
    }

    if (filters.query) {
      where.OR = [
        { name: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
        { tags: { has: filters.query.toLowerCase() } },
      ];
    }
    return where;
  }

  private buildOrderBy(sort: SortOption): Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] {
    switch (sort) {
      case 'newest':
        return { createdAt: 'desc' };
      case 'price_asc':
        return { price: 'asc' };
      case 'price_desc':
        return { price: 'desc' };
      case 'best_selling':
        return [{ soldCount: 'desc' }, { createdAt: 'desc' }];
      case 'relevance':
      default:
        return [{ soldCount: 'desc' }, { ratingAvg: 'desc' }, { createdAt: 'desc' }];
    }
  }

  private toCard(row: CardRow): ProductCard {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      price: Number(row.price),
      salePrice: row.salePrice !== null ? Number(row.salePrice) : null,
      thumbnailUrl: row.media[0]?.url ?? null,
      gender: row.gender,
      storeId: row.storeId,
      storeName: row.store.commercialName,
      storeSlug: row.store.slug,
      ratingAvg: Number(row.ratingAvg),
      ratingCount: row.ratingCount,
      soldCount: row.soldCount,
      createdAt: row.createdAt,
    };
  }
}

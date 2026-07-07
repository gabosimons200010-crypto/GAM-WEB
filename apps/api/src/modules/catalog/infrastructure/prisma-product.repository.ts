import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  ProductRepository,
  CreateProductData,
  UpdateProductData,
  AddMediaData,
  ListProductsFilter,
} from '../application/ports/product.repository';
import { ProductStatus, ProductView, VariantContext } from '../domain/product';

const productInclude = {
  variants: { include: { inventory: true }, orderBy: { sku: 'asc' } },
  media: { orderBy: { position: 'asc' } },
  store: { select: { commercialName: true, slug: true } },
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

@Injectable()
export class PrismaProductRepository extends ProductRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async slugExists(slug: string): Promise<boolean> {
    return (await this.prisma.product.count({ where: { slug } })) > 0;
  }

  async create(data: CreateProductData): Promise<ProductView> {
    const row = await this.prisma.product.create({
      data: {
        storeId: data.storeId,
        slug: data.slug,
        sku: data.sku,
        name: data.name,
        description: data.description ?? null,
        categoryId: data.categoryId ?? null,
        gender: data.gender ?? null,
        price: data.price,
        salePrice: data.salePrice ?? null,
        tags: data.tags ?? [],
        attributes: (data.attributes ?? undefined) as Prisma.InputJsonValue | undefined,
        status: 'DRAFT',
        media: data.imageUrls?.length
          ? { create: data.imageUrls.map((url, i) => ({ kind: 'ORIGINAL', url, position: i })) }
          : undefined,
        variants: {
          create: data.variants.map((v) => ({
            sku: v.sku,
            size: v.size ?? null,
            color: v.color ?? null,
            colorHex: v.colorHex ?? null,
            price: v.price ?? null,
            inventory: { create: { available: v.stock, reserved: 0 } },
          })),
        },
      },
      include: productInclude,
    });
    return this.toView(row);
  }

  async findById(id: string): Promise<ProductView | null> {
    const row = await this.prisma.product.findUnique({ where: { id }, include: productInclude });
    return row ? this.toView(row) : null;
  }

  async findActiveBySlug(slug: string): Promise<ProductView | null> {
    const row = await this.prisma.product.findFirst({
      where: { slug, status: 'ACTIVE' },
      include: productInclude,
    });
    return row ? this.toView(row) : null;
  }

  async listByStore(filter: ListProductsFilter) {
    const where: Prisma.ProductWhereInput = {
      storeId: filter.storeId,
      status: filter.status,
      archivedAt: filter.status === 'ARCHIVED' ? undefined : null,
    };
    if (filter.lowStock) {
      where.variants = {
        some: { inventory: { available: { lte: filter.lowStockThreshold ?? 5 } } },
      };
    }
    const rows = await this.prisma.product.findMany({
      where,
      include: productInclude,
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

  async listModeration(cursor: string | undefined, limit: number) {
    const rows = await this.prisma.product.findMany({
      where: { status: 'IN_REVIEW' },
      include: productInclude,
      orderBy: { createdAt: 'asc' }, // los más antiguos primero (FIFO de moderación)
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return {
      items: page.map((r) => this.toView(r)),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    };
  }

  async updateScalars(id: string, data: UpdateProductData): Promise<ProductView> {
    const row = await this.prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description ?? undefined,
        categoryId: data.categoryId ?? undefined,
        gender: data.gender ?? undefined,
        price: data.price,
        // null limpia la oferta (Prisma pone la columna en NULL); undefined la deja igual.
        salePrice: data.salePrice === undefined ? undefined : data.salePrice,
        tags: data.tags,
      },
      include: productInclude,
    });
    return this.toView(row);
  }

  async setStatus(id: string, status: ProductStatus): Promise<void> {
    await this.prisma.product.update({ where: { id }, data: { status } });
  }

  async archive(id: string): Promise<void> {
    await this.prisma.product.update({
      where: { id },
      data: { status: 'ARCHIVED', archivedAt: new Date() },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({ where: { id } });
  }

  async addMedia(productId: string, media: AddMediaData): Promise<void> {
    await this.prisma.productMedia.create({
      data: {
        productId,
        kind: media.kind,
        url: media.url,
        position: media.position ?? 0,
        width: media.width ?? null,
        height: media.height ?? null,
        bytes: media.bytes ?? null,
      },
    });
  }

  async deleteMedia(productId: string, mediaId: string): Promise<void> {
    // Scoped por productId para que no se pueda borrar media de otro producto.
    await this.prisma.productMedia.deleteMany({ where: { id: mediaId, productId } });
  }

  async getVariantContext(variantId: string): Promise<VariantContext | null> {
    const v = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: { select: { id: true, storeId: true } }, inventory: true },
    });
    if (!v) return null;
    return {
      variantId: v.id,
      productId: v.productId,
      storeId: v.product.storeId,
      available: v.inventory?.available ?? 0,
    };
  }

  async setVariantAvailable(variantId: string, available: number): Promise<void> {
    await this.prisma.inventory.upsert({
      where: { variantId },
      create: { variantId, available, reserved: 0 },
      update: { available },
    });
  }

  private toView(row: ProductRow): ProductView {
    return {
      id: row.id,
      storeId: row.storeId,
      storeName: row.store.commercialName,
      storeSlug: row.store.slug,
      slug: row.slug,
      sku: row.sku,
      name: row.name,
      description: row.description,
      categoryId: row.categoryId,
      gender: row.gender,
      price: Number(row.price),
      salePrice: row.salePrice !== null ? Number(row.salePrice) : null,
      status: row.status,
      tags: row.tags,
      ratingAvg: Number(row.ratingAvg),
      ratingCount: row.ratingCount,
      soldCount: row.soldCount,
      createdAt: row.createdAt,
      variants: row.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        size: v.size,
        color: v.color,
        colorHex: v.colorHex,
        price: v.price !== null ? Number(v.price) : null,
        available: v.inventory?.available ?? 0,
        reserved: v.inventory?.reserved ?? 0,
      })),
      media: row.media.map((m) => ({ id: m.id, kind: m.kind, url: m.url, position: m.position })),
    };
  }
}

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CartRepository, PurchasableVariant } from '../application/ports/cart.repository';
import { RawCartLine } from '../domain/cart';

const variantInclude = {
  inventory: true,
  product: {
    include: {
      store: { select: { id: true, commercialName: true, slug: true, status: true } },
      media: { orderBy: { position: 'asc' }, take: 1 },
    },
  },
} satisfies Prisma.ProductVariantInclude;

type VariantRow = Prisma.ProductVariantGetPayload<{ include: typeof variantInclude }>;

@Injectable()
export class PrismaCartRepository extends CartRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async getOrCreateForUser(userId: string): Promise<string> {
    const existing = await this.prisma.cart.findFirst({ where: { userId }, select: { id: true } });
    if (existing) return existing.id;
    const created = await this.prisma.cart.create({ data: { userId }, select: { id: true } });
    return created.id;
  }

  async getLines(cartId: string): Promise<RawCartLine[]> {
    const items = await this.prisma.cartItem.findMany({ where: { cartId }, orderBy: { id: 'asc' } });
    if (items.length === 0) return [];

    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: items.map((i) => i.variantId) } },
      include: variantInclude,
    });
    const byId = new Map(variants.map((v) => [v.id, v]));

    const lines: RawCartLine[] = [];
    for (const item of items) {
      const v = byId.get(item.variantId);
      if (!v) continue; // variante borrada: se omite (se limpiará al pagar)
      lines.push(this.toRawLine(v, item.quantity));
    }
    return lines;
  }

  async getPurchasable(variantId: string): Promise<PurchasableVariant | null> {
    const v = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { inventory: true, product: { include: { store: { select: { status: true } } } } },
    });
    if (!v) return null;
    return {
      variantId: v.id,
      productStatus: v.product.status,
      storeStatus: v.product.store.status,
      available: v.inventory?.available ?? 0,
    };
  }

  async addOrIncrement(cartId: string, variantId: string, quantity: number): Promise<void> {
    await this.prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId, variantId } },
      create: { cartId, variantId, quantity },
      update: { quantity: { increment: quantity } },
    });
    await this.touch(cartId);
  }

  async setQuantity(cartId: string, variantId: string, quantity: number): Promise<void> {
    await this.prisma.cartItem.update({
      where: { cartId_variantId: { cartId, variantId } },
      data: { quantity },
    });
    await this.touch(cartId);
  }

  async hasItem(cartId: string, variantId: string): Promise<boolean> {
    return (await this.prisma.cartItem.count({ where: { cartId, variantId } })) > 0;
  }

  async removeItem(cartId: string, variantId: string): Promise<void> {
    await this.prisma.cartItem.deleteMany({ where: { cartId, variantId } });
    await this.touch(cartId);
  }

  async clear(cartId: string): Promise<void> {
    await this.prisma.cartItem.deleteMany({ where: { cartId } });
    await this.touch(cartId);
  }

  private async touch(cartId: string): Promise<void> {
    await this.prisma.cart.update({ where: { id: cartId }, data: { updatedAt: new Date() } });
  }

  private toRawLine(v: VariantRow, quantity: number): RawCartLine {
    const p = v.product;
    return {
      variantId: v.id,
      productId: p.id,
      productSlug: p.slug,
      productName: p.name,
      productStatus: p.status,
      storeId: p.store.id,
      storeName: p.store.commercialName,
      storeSlug: p.store.slug,
      storeStatus: p.store.status,
      size: v.size,
      color: v.color,
      variantPrice: v.price !== null ? Number(v.price) : null,
      productPrice: Number(p.price),
      productSalePrice: p.salePrice !== null ? Number(p.salePrice) : null,
      available: v.inventory?.available ?? 0,
      quantity,
      thumbnailUrl: p.media[0]?.url ?? null,
    };
  }
}

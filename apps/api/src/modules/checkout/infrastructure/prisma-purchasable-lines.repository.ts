import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RawCartLine } from '../../cart/domain/cart';
import { GuestItemInput, PurchasableLinesPort } from '../application/ports/purchasable-lines.port';

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
export class PrismaPurchasableLinesRepository extends PurchasableLinesPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async resolve(items: GuestItemInput[]): Promise<RawCartLine[]> {
    // Suma cantidades por variante (por si vienen repetidas) y descarta ≤ 0.
    const qtyByVariant = new Map<string, number>();
    for (const it of items) {
      if (it.quantity > 0) qtyByVariant.set(it.variantId, (qtyByVariant.get(it.variantId) ?? 0) + it.quantity);
    }
    if (qtyByVariant.size === 0) return [];

    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: [...qtyByVariant.keys()] } },
      include: variantInclude,
    });

    return variants.map((v) => this.toRawLine(v, qtyByVariant.get(v.id) ?? 0));
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

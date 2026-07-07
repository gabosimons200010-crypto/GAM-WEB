import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

export interface StyleSales {
  style: string;
  units: number; // unidades vendidas (soldCount acumulado)
  revenue: number; // ingreso estimado = unidades × precio
  products: number; // cuántos productos activos llevan el estilo
  share: number; // % de unidades sobre el total
}

export interface SalesByStyleResult {
  styles: StyleSales[];
  totals: { units: number; revenue: number; products: number; styles: number };
}

/**
 * Ventas por estilo/look (solo admin). Cruza el catálogo activo con sus
 * styleTags y agrega unidades e ingreso (base para trend forecasting).
 * Usa soldCount como métrica de ventas históricas del producto.
 */
@Injectable()
export class SalesByStyleUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<SalesByStyleResult> {
    const products = await this.prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: { styleTags: true, soldCount: true, price: true },
    });

    const map = new Map<string, StyleSales>();
    let totalUnits = 0;
    let totalRevenue = 0;
    for (const p of products) {
      const price = Number(p.price);
      totalUnits += p.soldCount;
      totalRevenue += p.soldCount * price;
      for (const style of p.styleTags) {
        const e = map.get(style) ?? { style, units: 0, revenue: 0, products: 0, share: 0 };
        e.units += p.soldCount;
        e.revenue += p.soldCount * price;
        e.products += 1;
        map.set(style, e);
      }
    }

    const round2 = (n: number) => Math.round(n * 100) / 100;
    const styles = [...map.values()]
      .map((s) => ({ ...s, revenue: round2(s.revenue), share: totalUnits ? round2((s.units / totalUnits) * 100) : 0 }))
      .sort((a, b) => b.units - a.units);

    return {
      styles,
      totals: { units: totalUnits, revenue: round2(totalRevenue), products: products.length, styles: styles.length },
    };
  }
}

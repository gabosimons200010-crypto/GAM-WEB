import { ForbiddenException, Injectable } from '@nestjs/common';
import { ProductRepository } from '../ports/product.repository';
import { CategoryRepository } from '../ports/category.repository';
import { ImportJobRepository, RowError } from '../ports/import-job.repository';
import { StoreRepository } from '../../../seller/application/ports/store.repository';
import { StoragePort } from '../../../../shared/storage/storage.port';
import { Gender, generateProductSku, variantSku } from '../../domain/product';
import { slugify } from '../../../seller/domain/store';

const MAX_ROWS = 200; // RF-SHOP-004 / IA-007

export interface ImportVariantRow {
  size?: string;
  color?: string;
  colorHex?: string;
  stock: number;
  price?: number;
}

export interface ImportRow {
  name: string;
  description?: string;
  categorySlug?: string;
  gender?: Gender;
  price: number;
  salePrice?: number;
  tags?: string[];
  variants: ImportVariantRow[];
  imageKeys?: string[];
}

export interface ImportInput {
  userId: string;
  storeId: string;
  rows: ImportRow[];
  dryRun?: boolean;
}

export interface ImportSummary {
  jobId: string | null;
  rowsTotal: number;
  rowsOk: number;
  rowsError: number;
  errors: RowError[];
  created: number;
}

/**
 * Importación masiva de productos (IA-007). Valida fila por fila (máx 200),
 * reporta errores y, salvo en dry-run, crea borradores para las filas válidas.
 * El frontend convierte el Excel ↔ filas JSON (plantilla documentada).
 */
@Injectable()
export class ImportProductsUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly categories: CategoryRepository,
    private readonly stores: StoreRepository,
    private readonly storage: StoragePort,
    private readonly jobs: ImportJobRepository,
  ) {}

  async execute(input: ImportInput): Promise<ImportSummary> {
    if (!(await this.stores.userOwnsStore(input.userId, input.storeId))) {
      throw new ForbiddenException('No administras esta tienda');
    }
    const rows = input.rows.slice(0, MAX_ROWS);
    const errors: RowError[] = [];
    const valid: { row: ImportRow; categoryId: string | null }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowErrors = await this.validateRow(row);
      if (rowErrors.length) {
        errors.push({ row: i + 1, message: rowErrors.join('; ') });
      } else {
        const categoryId = row.categorySlug ? await this.categories.idBySlug(row.categorySlug) : null;
        valid.push({ row, categoryId });
      }
    }

    let created = 0;
    if (!input.dryRun) {
      for (const { row, categoryId } of valid) {
        await this.createOne(input.storeId, row, categoryId);
        created++;
      }
    }

    const result = {
      rowsTotal: rows.length,
      rowsOk: valid.length,
      rowsError: errors.length,
      errors,
    };
    const job = input.dryRun ? null : await this.jobs.record(input.storeId, null, result);

    return { jobId: job?.id ?? null, ...result, created };
  }

  private async validateRow(row: ImportRow): Promise<string[]> {
    const e: string[] = [];
    if (!row.name || row.name.trim().length < 2) e.push('nombre requerido');
    if (typeof row.price !== 'number' || row.price <= 0) e.push('precio inválido (> 0)');
    if (!Array.isArray(row.variants) || row.variants.length === 0) e.push('al menos una variante');
    else if (row.variants.some((v) => typeof v.stock !== 'number' || v.stock < 0))
      e.push('stock de variante inválido');
    if (row.categorySlug && !(await this.categories.idBySlug(row.categorySlug)))
      e.push(`categoría "${row.categorySlug}" no existe`);
    return e;
  }

  private async createOne(storeId: string, row: ImportRow, categoryId: string | null): Promise<void> {
    const slug = await this.uniqueSlug(row.name);
    const sku = generateProductSku(slug);
    const product = await this.products.create({
      storeId,
      slug,
      sku,
      name: row.name.trim(),
      description: row.description ?? null,
      categoryId,
      gender: row.gender ?? null,
      price: row.price,
      salePrice: row.salePrice ?? null,
      tags: row.tags ?? [],
      variants: row.variants.map((v, i) => ({
        sku: variantSku(sku, v.size ?? null, v.color ?? null, i),
        size: v.size ?? null,
        color: v.color ?? null,
        colorHex: v.colorHex ?? null,
        price: v.price ?? null,
        stock: v.stock,
      })),
    });
    for (const [i, key] of (row.imageKeys ?? []).entries()) {
      await this.products.addMedia(product.id, {
        kind: 'ORIGINAL',
        url: this.storage.publicUrl(key),
        position: i,
      });
    }
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base = slugify(name) || 'producto';
    let candidate = base;
    let n = 1;
    while (await this.products.slugExists(candidate)) {
      n += 1;
      candidate = `${base}-${n}`;
    }
    return candidate;
  }
}

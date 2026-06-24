import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductRepository } from '../ports/product.repository';
import { OutboxPublisher } from '../../../../shared/events/outbox';
import { AuditLogger } from '../../../../shared/audit/audit-logger';
import { ProductView } from '../../domain/product';

export interface ModerationContext {
  adminId: string;
  ip?: string | null;
  reason?: string;
}

/**
 * Cola de moderación de productos (RF-ADM-002). Los productos de tiendas no
 * verificadas se publican en IN_REVIEW; el admin aprueba (→ACTIVE) o rechaza
 * (→REJECTED) con motivo. Cada decisión se audita (RF-ADM-006) y notifica.
 * Vive en Catalog (dueño del agregado Product); lo invoca el panel admin.
 */
@Injectable()
export class ProductModerationActions {
  constructor(
    private readonly products: ProductRepository,
    private readonly audit: AuditLogger,
    private readonly outbox: OutboxPublisher,
  ) {}

  list(cursor: string | undefined, limit: number) {
    return this.products.listModeration(cursor, limit);
  }

  async approve(productId: string, ctx: ModerationContext): Promise<ProductView> {
    const product = await this.require(productId);
    await this.products.setStatus(productId, 'ACTIVE');
    await this.audit.log({
      actorId: ctx.adminId,
      action: 'product.approve',
      entity: 'Product',
      entityId: productId,
      ip: ctx.ip,
    });
    await this.outbox.publish({
      aggregate: 'Product',
      aggregateId: productId,
      type: 'ProductPublished',
      payload: { storeId: product.storeId, productId, status: 'ACTIVE', moderated: true },
    });
    return { ...product, status: 'ACTIVE' };
  }

  async reject(productId: string, ctx: ModerationContext): Promise<ProductView> {
    const product = await this.require(productId);
    await this.products.setStatus(productId, 'REJECTED');
    await this.audit.log({
      actorId: ctx.adminId,
      action: 'product.reject',
      entity: 'Product',
      entityId: productId,
      metadata: ctx.reason ? { reason: ctx.reason } : null,
      ip: ctx.ip,
    });
    await this.outbox.publish({
      aggregate: 'Product',
      aggregateId: productId,
      type: 'ProductRejected',
      payload: { storeId: product.storeId, productId, reason: ctx.reason ?? null },
    });
    return { ...product, status: 'REJECTED' };
  }

  private async require(productId: string): Promise<ProductView> {
    const product = await this.products.findById(productId);
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    return product;
  }
}

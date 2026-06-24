import { Injectable, NotFoundException } from '@nestjs/common';
import { StoreRepository, ListStoresFilter } from '../ports/store.repository';
import { StoreView, StoreStatus } from '../../domain/store';
import { AuditLogger } from '../../../../shared/audit/audit-logger';

export interface AdminActionContext {
  adminId: string;
  ip?: string | null;
  reason?: string;
}

/**
 * Acciones de administración sobre el agregado Store (RF-ADM-001): listar,
 * aprobar, rechazar, suspender y verificar. Cada acción queda auditada
 * (RF-ADM-006). Vive en el contexto Seller porque opera sobre su agregado;
 * lo invoca el controlador del panel admin.
 */
@Injectable()
export class AdminStoreActions {
  constructor(
    private readonly stores: StoreRepository,
    private readonly audit: AuditLogger,
  ) {}

  list(filter: ListStoresFilter) {
    return this.stores.list(filter);
  }

  get(storeId: string) {
    return this.require(storeId);
  }

  async approve(storeId: string, ctx: AdminActionContext): Promise<StoreView> {
    await this.require(storeId);
    return this.transition(storeId, 'APPROVED', 'store.approve', ctx);
  }

  async reject(storeId: string, ctx: AdminActionContext): Promise<StoreView> {
    await this.require(storeId);
    return this.transition(storeId, 'REJECTED', 'store.reject', ctx);
  }

  async suspend(storeId: string, ctx: AdminActionContext): Promise<StoreView> {
    await this.require(storeId);
    return this.transition(storeId, 'SUSPENDED', 'store.suspend', ctx);
  }

  async verify(storeId: string, verified: boolean, ctx: AdminActionContext): Promise<StoreView> {
    await this.require(storeId);
    await this.stores.setVerified(storeId, verified);
    await this.audit.log({
      actorId: ctx.adminId,
      action: verified ? 'store.verify' : 'store.unverify',
      entity: 'Store',
      entityId: storeId,
      ip: ctx.ip,
    });
    return this.require(storeId);
  }

  private async transition(
    storeId: string,
    status: StoreStatus,
    action: string,
    ctx: AdminActionContext,
  ): Promise<StoreView> {
    await this.stores.setStatus(storeId, status);
    await this.audit.log({
      actorId: ctx.adminId,
      action,
      entity: 'Store',
      entityId: storeId,
      metadata: ctx.reason ? { reason: ctx.reason } : null,
      ip: ctx.ip,
    });
    return this.require(storeId);
  }

  private async require(storeId: string): Promise<StoreView> {
    const store = await this.stores.findById(storeId);
    if (!store) {
      throw new NotFoundException('Tienda no encontrada');
    }
    return store;
  }
}

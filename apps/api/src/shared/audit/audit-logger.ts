import { RoleName } from '@prisma/client';

/**
 * Registro de auditoría (RF-ADM-006 / RNF-SEC). Puerto compartido: cualquier
 * contexto registra acciones sensibles sin conocer la persistencia.
 */
export interface AuditEntry {
  actorId?: string | null;
  action: string; // p.ej. "store.approve", "payment.refund"
  entity: string; // "Store" | "Order" | ...
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
}

export abstract class AuditLogger {
  abstract log(entry: AuditEntry): Promise<void>;
}

export const PLATFORM_ROLES: RoleName[] = [RoleName.ADMIN, RoleName.SUPER_ADMIN];

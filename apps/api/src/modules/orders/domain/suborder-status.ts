/**
 * Ciclo de vida de una suborden (lo que cada tienda prepara y despacha).
 * El comprador paga (Sprint 10) y la suborden pasa a PAID; de ahí en adelante
 * el vendedor la mueve. Order.status es grueso (PENDING_PAYMENT/PAID/CANCELLED);
 * el detalle vive aquí (RF-MKT-007).
 */
export type SubOrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED'
  | 'DELIVERY_FAILED';

/**
 * Transiciones permitidas que puede ejecutar el vendedor tras el pago. El
 * estado PENDING_PAYMENT lo gestiona el pago, no el vendedor.
 */
const TRANSITIONS: Record<SubOrderStatus, SubOrderStatus[]> = {
  PENDING_PAYMENT: [],
  PAID: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY_FOR_PICKUP', 'SHIPPED', 'CANCELLED'],
  READY_FOR_PICKUP: ['DELIVERED', 'DELIVERY_FAILED'],
  SHIPPED: ['DELIVERED', 'DELIVERY_FAILED'],
  DELIVERY_FAILED: ['SHIPPED', 'READY_FOR_PICKUP', 'CANCELLED'],
  DELIVERED: ['RETURNED'],
  CANCELLED: [],
  RETURNED: [],
};

export function allowedTransitions(from: SubOrderStatus): SubOrderStatus[] {
  return TRANSITIONS[from] ?? [];
}

export function canTransition(from: SubOrderStatus, to: SubOrderStatus): boolean {
  return allowedTransitions(from).includes(to);
}

/** Estados finales: no admiten más cambios. */
export function isTerminal(status: SubOrderStatus): boolean {
  return allowedTransitions(status).length === 0;
}

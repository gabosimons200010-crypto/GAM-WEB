import { OrderView, SellerSubOrderView } from '../../domain/order-view';
import { SubOrderStatus } from '../../domain/suborder-status';

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

/** Identidad mínima de una suborden para validar propiedad y transición. */
export interface SubOrderRef {
  id: string;
  storeId: string;
  status: SubOrderStatus;
}

export abstract class OrderQueryRepository {
  /** Órdenes del comprador, más recientes primero. */
  abstract listByUser(userId: string, cursor: string | undefined, limit: number): Promise<Page<OrderView>>;

  /** Detalle de una orden del comprador. null si no existe o no es suya. */
  abstract findForUser(orderId: string, userId: string): Promise<OrderView | null>;

  /**
   * Rastreo público de una orden por número + correo (invitado o comprador).
   * null si no coincide. El correo se compara sin distinguir mayúsculas.
   */
  abstract findByNumberAndEmail(number: string, email: string): Promise<OrderView | null>;

  /** Subórdenes de un conjunto de tiendas (cola del vendedor), opcional por estado. */
  abstract listForStores(
    storeIds: string[],
    status: SubOrderStatus | undefined,
    cursor: string | undefined,
    limit: number,
  ): Promise<Page<SellerSubOrderView>>;

  /** Suborden mínima para validar antes de cambiar su estado. */
  abstract getSubOrderRef(subOrderId: string): Promise<SubOrderRef | null>;

  /**
   * Cambia el estado de la suborden y registra el historial (OrderStatusHistory)
   * en una transacción. trackingCode opcional al despachar.
   */
  abstract advanceStatus(
    subOrderId: string,
    to: SubOrderStatus,
    changedBy: string,
    note: string | null,
    trackingCode: string | null,
  ): Promise<SellerSubOrderView>;
}

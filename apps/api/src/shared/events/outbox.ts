/**
 * Publicación de eventos de dominio vía patrón Outbox (docs/01 §1.4). Se inserta
 * el evento en la misma transacción que el cambio de negocio; un relay (sprint
 * posterior) los lee y los entrega a BullMQ. Por ahora deja el registro listo
 * para ese relay.
 */
export interface DomainEvent {
  aggregate: string; // "Product" | "Order" | ...
  aggregateId: string;
  type: string; // "StockLow" | "OrderPaid" | ...
  version?: number;
  payload: Record<string, unknown>;
}

export abstract class OutboxPublisher {
  abstract publish(event: DomainEvent): Promise<void>;
}

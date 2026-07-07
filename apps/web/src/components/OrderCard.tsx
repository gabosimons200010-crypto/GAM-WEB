'use client';

import type { OrderView, OrderSubView } from '@/lib/types';
import { money, statusLabel } from '@/lib/format';
import { OrderTimeline } from '@/components/OrderTimeline';

/** ¿El pedido aún puede cancelarlo el comprador? (no salió). */
const BLOCKED = ['READY_FOR_PICKUP', 'SHIPPED', 'DELIVERED', 'RETURNED', 'DELIVERY_FAILED'];
export function isCancelable(order: OrderView): boolean {
  return (
    (order.status === 'PENDING_PAYMENT' || order.status === 'PAID') &&
    !order.subOrders.some((s) => BLOCKED.includes(s.status))
  );
}

/** Tarjeta de un pedido con línea de tiempo por envío. Reutilizada en Mis pedidos y Rastrear. */
export function OrderCard({
  order,
  delay = 0,
  onCancel,
  canceling = false,
}: {
  order: OrderView;
  delay?: number;
  onCancel?: (id: string) => void;
  canceling?: boolean;
}) {
  return (
    <div className="gg-fade-up border border-line" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-4">
        <div>
          <p className="font-display text-xl text-ink">{order.number}</p>
          <p className="microcaps text-[10px] text-muted">
            {new Date(order.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <span className="microcaps border border-ink px-3 py-1 text-ink">{statusLabel(order.status)}</span>
      </div>

      <div className="divide-y divide-line">
        {order.subOrders.map((s) => (
          <ShipmentBlock key={s.id} sub={s} createdAt={order.createdAt} />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3">
        <span className="microcaps text-muted">
          Total <span className="ml-2 text-[15px] text-ink">{money(order.grandTotal)}</span>
        </span>
        {onCancel && isCancelable(order) && (
          <button
            onClick={() => onCancel(order.id)}
            disabled={canceling}
            className="microcaps border border-line px-3 py-1.5 text-sale transition hover:border-sale disabled:opacity-50"
          >
            {canceling ? 'Cancelando…' : 'Cancelar pedido'}
          </button>
        )}
      </div>
    </div>
  );
}

function ShipmentBlock({ sub, createdAt }: { sub: OrderSubView; createdAt: string }) {
  const delivered = sub.status === 'DELIVERED';
  const cancelled = ['CANCELLED', 'RETURNED', 'DELIVERY_FAILED'].includes(sub.status);
  const eta = new Date(new Date(createdAt).getTime() + 3 * 864e5);

  return (
    <div className="px-5 py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="microcaps text-ink">{sub.storeName ?? 'Tienda'}</span>
        <span className={`microcaps ${delivered ? 'text-ink' : cancelled ? 'text-sale' : 'text-muted'}`}>
          {delivered ? 'Entregado ✓' : statusLabel(sub.status)}
        </span>
      </div>

      <OrderTimeline status={sub.status} />

      {!cancelled && (
        <p className="microcaps mt-4 text-[10px] text-muted">
          {delivered ? (
            <>Entregado — ¡gracias por tu compra!</>
          ) : (
            <>
              Entrega estimada:{' '}
              <span className="text-ink">{eta.toLocaleDateString('es-PE', { day: '2-digit', month: 'long' })}</span>
            </>
          )}
          {sub.trackingCode && (
            <>
              {' · '}Seguimiento <span className="text-ink">{sub.trackingCode}</span>
            </>
          )}
        </p>
      )}

      <ul className="mt-3 space-y-0.5">
        {sub.items.map((it) => (
          <li key={it.variantId} className="text-[13px] text-ink">
            {it.quantity}× {it.productName}
            {[it.size, it.color].filter(Boolean).length > 0 && ` (${[it.size, it.color].filter(Boolean).join(', ')})`}
          </li>
        ))}
      </ul>
    </div>
  );
}

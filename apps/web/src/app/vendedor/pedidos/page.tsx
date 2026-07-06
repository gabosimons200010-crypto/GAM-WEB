'use client';

import { useEffect, useState } from 'react';
import { listSellerOrders, advanceOrderStatus, ClientApiError } from '@/lib/client-api';
import type { SellerSubOrder } from '@/lib/types';
import { money, statusLabel } from '@/lib/format';

// Acciones de avance disponibles según el estado (espejo de la máquina de estados del backend).
const NEXT: Record<string, { to: string; label: string }[]> = {
  PAID: [{ to: 'PREPARING', label: 'Preparar' }],
  PREPARING: [
    { to: 'SHIPPED', label: 'Marcar enviado' },
    { to: 'READY_FOR_PICKUP', label: 'Listo p/ recojo' },
  ],
  READY_FOR_PICKUP: [{ to: 'DELIVERED', label: 'Marcar entregado' }],
  SHIPPED: [{ to: 'DELIVERED', label: 'Marcar entregado' }],
  DELIVERY_FAILED: [{ to: 'SHIPPED', label: 'Reintentar envío' }],
};

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<SellerSubOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [tracking, setTracking] = useState<Record<string, string>>({});

  function load() {
    listSellerOrders()
      .then((r) => setOrders(r.items))
      .catch((e) => setError(e instanceof ClientApiError ? e.message : 'No pudimos cargar los pedidos'));
  }

  useEffect(load, []);

  async function advance(subOrderId: string, to: string) {
    setBusy(subOrderId);
    setError(null);
    try {
      const code = to === 'SHIPPED' ? tracking[subOrderId]?.trim() || undefined : undefined;
      const updated = await advanceOrderStatus(subOrderId, to, undefined, code);
      setOrders((prev) =>
        prev ? prev.map((s) => (s.id === subOrderId ? { ...s, status: updated.status, trackingCode: updated.trackingCode } : s)) : prev,
      );
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : 'No se pudo actualizar');
    } finally {
      setBusy(null);
    }
  }

  if (orders === null && !error) return <p className="microcaps text-muted">Cargando pedidos…</p>;

  return (
    <div className="space-y-6">
      <h1 className="border-b border-line pb-3 font-display text-3xl text-ink">Pedidos</h1>
      {error && <p className="microcaps text-sale">{error}</p>}

      {orders && orders.length === 0 ? (
        <div className="border border-dashed border-line p-12 text-center">
          <p className="font-display text-2xl text-ink">Aún no tienes pedidos</p>
          <p className="microcaps mt-3 text-muted">Cuando alguien compre tus productos, aparecerán aquí.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders?.map((s) => (
            <div key={s.id} className="border border-line p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
                <div>
                  <p className="microcaps text-ink">{s.orderNumber}</p>
                  <p className="microcaps text-[10px] text-muted">{new Date(s.createdAt).toLocaleString('es-PE')}</p>
                </div>
                <span className="microcaps text-ink">{statusLabel(s.status)}</span>
              </div>

              <ul className="mt-3 space-y-1">
                {s.items.map((it) => (
                  <li key={it.variantId} className="flex justify-between text-[13px] text-ink">
                    <span>
                      {it.quantity}× {it.productName}
                      {[it.size, it.color].filter(Boolean).length > 0 && ` (${[it.size, it.color].filter(Boolean).join(', ')})`}
                    </span>
                    <span>{money(it.unitPrice * it.quantity)}</span>
                  </li>
                ))}
              </ul>

              {s.shipTo && (
                <p className="microcaps mt-3 text-[10px] text-muted">
                  {s.buyerName ? `${s.buyerName} — ` : ''}
                  {[s.shipTo.line, s.shipTo.district, s.shipTo.province].filter(Boolean).join(', ')}
                  {s.shipTo.phone && ` · ${s.shipTo.phone}`}
                </p>
              )}

              {s.trackingCode && (
                <p className="microcaps mt-2 text-[10px] text-ink">Tracking: {s.trackingCode}</p>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                <span className="microcaps text-muted">
                  Subtotal <span className="text-ink">{money(s.subtotal)}</span> · comisión {money(s.commission)}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {(NEXT[s.status] ?? []).some((a) => a.to === 'SHIPPED') && (
                    <input
                      value={tracking[s.id] ?? ''}
                      onChange={(e) => setTracking((t) => ({ ...t, [s.id]: e.target.value }))}
                      placeholder="CÓD. TRACKING (OPCIONAL)"
                      className="microcaps w-48 border-b border-line bg-transparent pb-1 text-ink placeholder:text-line focus:border-ink focus:outline-none"
                    />
                  )}
                  {(NEXT[s.status] ?? []).map((action) => (
                    <button
                      key={action.to}
                      onClick={() => advance(s.id, action.to)}
                      disabled={busy === s.id}
                      className="microcaps bg-ink px-3 py-1.5 text-paper hover:opacity-80 disabled:opacity-50"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

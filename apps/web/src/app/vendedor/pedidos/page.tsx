'use client';

import { useEffect, useState } from 'react';
import { listSellerOrders, advanceOrderStatus, ClientApiError } from '@/lib/client-api';
import type { SellerSubOrder } from '@/lib/types';
import { money, statusColor, statusLabel } from '@/lib/format';

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
      const updated = await advanceOrderStatus(subOrderId, to);
      setOrders((prev) => (prev ? prev.map((s) => (s.id === subOrderId ? { ...s, status: updated.status } : s)) : prev));
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : 'No se pudo actualizar');
    } finally {
      setBusy(null);
    }
  }

  if (orders === null && !error) return <p className="text-gray-500">Cargando pedidos…</p>;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Pedidos</h1>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {orders && orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          <p className="text-3xl">📦</p>
          <p className="mt-2 font-medium">Aún no tienes pedidos</p>
          <p className="mt-1 text-sm">Cuando alguien compre tus productos, aparecerán aquí.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders?.map((s) => (
            <div key={s.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-mono font-semibold text-gray-800">{s.orderNumber}</p>
                  <p className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleString('es-PE')}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(s.status)}`}>
                  {statusLabel(s.status)}
                </span>
              </div>

              <ul className="mt-3 border-t border-gray-100 pt-3 text-sm text-gray-600">
                {s.items.map((it) => (
                  <li key={it.variantId} className="flex justify-between">
                    <span>
                      {it.quantity}× {it.productName}
                      {[it.size, it.color].filter(Boolean).length > 0 && ` (${[it.size, it.color].filter(Boolean).join(', ')})`}
                    </span>
                    <span>{money(it.unitPrice * it.quantity)}</span>
                  </li>
                ))}
              </ul>

              {s.shipTo && (
                <p className="mt-2 text-xs text-gray-500">
                  📍 {s.buyerName ? `${s.buyerName} — ` : ''}
                  {[s.shipTo.line, s.shipTo.district, s.shipTo.province].filter(Boolean).join(', ')}
                  {s.shipTo.phone && ` · ${s.shipTo.phone}`}
                </p>
              )}

              <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                <span className="text-sm">
                  Subtotal <span className="font-semibold">{money(s.subtotal)}</span>
                  <span className="ml-2 text-xs text-gray-400">(comisión {money(s.commission)})</span>
                </span>
                <div className="flex gap-2">
                  {(NEXT[s.status] ?? []).map((action) => (
                    <button
                      key={action.to}
                      onClick={() => advance(s.id, action.to)}
                      disabled={busy === s.id}
                      className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-600 disabled:opacity-60"
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

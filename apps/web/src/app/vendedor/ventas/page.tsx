'use client';

import { useEffect, useMemo, useState } from 'react';
import { listSellerOrders, getMyStores, ClientApiError } from '@/lib/client-api';
import type { SellerStore, SellerSubOrder } from '@/lib/types';
import { money, statusLabel } from '@/lib/format';

// Estados que cuentan como venta concretada (pagada en adelante).
const SOLD = new Set(['PAID', 'PREPARING', 'READY_FOR_PICKUP', 'SHIPPED', 'DELIVERED']);

export default function SellerSalesPage() {
  const [orders, setOrders] = useState<SellerSubOrder[] | null>(null);
  const [stores, setStores] = useState<SellerStore[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listSellerOrders(), getMyStores()])
      .then(([o, s]) => {
        setOrders(o.items);
        setStores(s);
      })
      .catch((e) => setError(e instanceof ClientApiError ? e.message : 'No pudimos cargar tus ventas'));
  }, []);

  const metrics = useMemo(() => {
    const sold = (orders ?? []).filter((o) => SOLD.has(o.status));
    const gross = sold.reduce((a, o) => a + o.subtotal, 0);
    const commission = sold.reduce((a, o) => a + o.commission, 0);
    const units = sold.reduce((a, o) => a + o.items.reduce((x, it) => x + it.quantity, 0), 0);

    // Ranking de productos por unidades vendidas.
    const byProduct = new Map<string, { name: string; units: number; revenue: number }>();
    for (const o of sold) {
      for (const it of o.items) {
        const cur = byProduct.get(it.productName) ?? { name: it.productName, units: 0, revenue: 0 };
        cur.units += it.quantity;
        cur.revenue += it.unitPrice * it.quantity;
        byProduct.set(it.productName, cur);
      }
    }
    const top = [...byProduct.values()].sort((a, b) => b.units - a.units).slice(0, 6);

    // Conteo por estado (todos los sub-pedidos, no solo vendidos).
    const byStatus = new Map<string, number>();
    for (const o of orders ?? []) byStatus.set(o.status, (byStatus.get(o.status) ?? 0) + 1);

    return { count: sold.length, gross, commission, net: gross - commission, units, top, byStatus: [...byStatus.entries()] };
  }, [orders]);

  if (error) return <p className="microcaps text-sale">{error}</p>;
  if (orders === null) return <p className="microcaps text-muted">Cargando ventas…</p>;

  const totalSalesCount = stores.reduce((a, s) => a + s.salesCount, 0);

  return (
    <div className="space-y-10">
      <h1 className="border-b border-line pb-3 font-display text-3xl text-ink">Ventas</h1>

      {/* Métricas principales */}
      <div className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
        <Metric label="Ingresos" value={money(metrics.gross)} />
        <Metric label="Comisión (10%)" value={money(metrics.commission)} />
        <Metric label="Neto" value={money(metrics.net)} />
        <Metric label="Pedidos" value={String(metrics.count)} sub={`${metrics.units} prendas`} />
      </div>

      {metrics.count === 0 && (
        <div className="border border-dashed border-line p-12 text-center">
          <p className="font-display text-2xl text-ink">Todavía no hay ventas</p>
          <p className="microcaps mt-3 text-muted">
            Cuando tus productos se vendan y se paguen, verás aquí tus ingresos y tu neto.
          </p>
        </div>
      )}

      {/* Top productos */}
      {metrics.top.length > 0 && (
        <section>
          <p className="microcaps mb-4 border-b border-line pb-2 text-muted">Más vendidos</p>
          <div className="border-t border-line">
            {metrics.top.map((p, i) => (
              <div key={p.name} className="flex items-center gap-4 border-b border-line py-3">
                <span className="microcaps w-6 text-muted">{String(i + 1).padStart(2, '0')}</span>
                <span className="microcaps flex-1 text-ink">{p.name}</span>
                <span className="microcaps w-24 text-right text-muted">{p.units} uds.</span>
                <span className="microcaps w-28 text-right text-ink">{money(p.revenue)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Estado de los pedidos */}
      {metrics.byStatus.length > 0 && (
        <section>
          <p className="microcaps mb-4 border-b border-line pb-2 text-muted">Pedidos por estado</p>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            {metrics.byStatus.map(([st, n]) => (
              <span key={st} className="microcaps text-ink">
                {statusLabel(st)} <span className="text-muted">· {n}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      <p className="microcaps text-[10px] text-muted">
        Ventas históricas registradas en tus tiendas: {totalSalesCount}. Los importes se calculan sobre pedidos pagados.
      </p>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-paper p-5">
      <p className="microcaps text-muted">{label}</p>
      <p className="mt-2 font-display text-2xl text-ink">{value}</p>
      {sub && <p className="microcaps mt-1 text-[10px] text-muted">{sub}</p>}
    </div>
  );
}

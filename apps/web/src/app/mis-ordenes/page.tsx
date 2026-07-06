'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { listOrders, ClientApiError } from '@/lib/client-api';
import type { OrderView, OrderSubView } from '@/lib/types';
import { money, statusLabel } from '@/lib/format';
import { OrderTimeline } from '@/components/OrderTimeline';

export default function MyOrdersPage() {
  const { user, ready } = useAuth();
  const [orders, setOrders] = useState<OrderView[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      setOrders([]);
      return;
    }
    listOrders()
      .then((r) => setOrders(r.items))
      .catch((e) => setError(e instanceof ClientApiError ? e.message : 'No pudimos cargar tus pedidos'));
  }, [ready, user]);

  if (ready && !user) {
    return (
      <Panel>
        <h1 className="font-display text-3xl text-ink">Inicia sesión para ver tus pedidos</h1>
        <Link href="/ingresar?next=/mis-ordenes" className="microcaps mt-8 inline-block bg-ink px-10 py-3.5 text-paper hover:opacity-80">
          Ingresar
        </Link>
      </Panel>
    );
  }

  if (error) return <Panel><p className="microcaps text-sale">{error}</p></Panel>;
  if (orders === null) return <Panel><p className="microcaps text-muted">Cargando…</p></Panel>;

  if (orders.length === 0) {
    return (
      <Panel>
        <h1 className="font-display text-3xl text-ink">Aún no tienes pedidos</h1>
        <Link href="/buscar" className="microcaps mt-8 inline-block bg-ink px-10 py-3.5 text-paper hover:opacity-80">
          Ver catálogo
        </Link>
      </Panel>
    );
  }

  return (
    <div className="space-y-10">
      <h1 className="border-b border-line pb-3 font-display text-3xl text-ink">Mis pedidos</h1>
      {orders.map((o, oi) => (
        <div key={o.id} className="gg-fade-up border border-line" style={{ animationDelay: `${oi * 80}ms` }}>
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-4">
            <div>
              <p className="font-display text-xl text-ink">{o.number}</p>
              <p className="microcaps text-[10px] text-muted">{new Date(o.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
            <span className="microcaps border border-ink px-3 py-1 text-ink">{statusLabel(o.status)}</span>
          </div>

          <div className="divide-y divide-line">
            {o.subOrders.map((s) => (
              <ShipmentBlock key={s.id} sub={s} createdAt={o.createdAt} />
            ))}
          </div>

          <div className="flex items-baseline justify-between border-t border-line px-5 py-3">
            <span className="microcaps text-muted">Total</span>
            <span className="text-[15px] text-ink">{money(o.grandTotal)}</span>
          </div>
        </div>
      ))}
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

      {/* Estado dinámico bajo la línea */}
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

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-lg py-20 text-center">{children}</div>;
}

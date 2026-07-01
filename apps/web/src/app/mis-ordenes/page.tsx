'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { listOrders, ClientApiError } from '@/lib/client-api';
import type { OrderView } from '@/lib/types';
import { money, statusColor, statusLabel } from '@/lib/format';

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
      .catch((e) => setError(e instanceof ClientApiError ? e.message : 'No pudimos cargar tus órdenes'));
  }, [ready, user]);

  if (ready && !user) {
    return (
      <Panel>
        <p className="text-4xl">🔒</p>
        <h1 className="mt-3 text-xl font-bold">Inicia sesión para ver tus órdenes</h1>
        <Link href="/ingresar?next=/mis-ordenes" className="mt-6 inline-block rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600">
          Ingresar
        </Link>
      </Panel>
    );
  }

  if (error) return <Panel><p className="text-red-600">{error}</p></Panel>;
  if (orders === null) return <Panel><p className="text-gray-500">Cargando…</p></Panel>;

  if (orders.length === 0) {
    return (
      <Panel>
        <p className="text-4xl">📦</p>
        <h1 className="mt-3 text-xl font-bold">Aún no tienes órdenes</h1>
        <Link href="/buscar" className="mt-6 inline-block rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600">
          Explorar catálogo
        </Link>
      </Panel>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Mis órdenes</h1>
      {orders.map((o) => (
        <div key={o.id} className="rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-5 py-3">
            <div>
              <p className="font-mono font-semibold text-gray-800">{o.number}</p>
              <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString('es-PE')}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(o.status)}`}>
              {statusLabel(o.status)}
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {o.subOrders.map((s) => (
              <div key={s.id} className="px-5 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{s.storeName ?? 'Tienda'}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor(s.status)}`}>
                    {statusLabel(s.status)}
                  </span>
                </div>
                <ul className="mt-1 text-sm text-gray-500">
                  {s.items.map((it) => (
                    <li key={it.variantId}>
                      {it.quantity}× {it.productName}
                      {[it.size, it.color].filter(Boolean).length > 0 && ` (${[it.size, it.color].filter(Boolean).join(', ')})`}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
            <span className="text-sm text-gray-500">Total</span>
            <span className="font-bold">{money(o.grandTotal)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-10 text-center">{children}</div>;
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { listOrders, ClientApiError } from '@/lib/client-api';
import type { OrderView } from '@/lib/types';
import { OrderCard } from '@/components/OrderCard';

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
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
        <h1 className="font-display text-3xl text-ink">Mis pedidos</h1>
        <Link href="/rastrear" className="microcaps text-muted hover:text-ink">Rastrear un pedido</Link>
      </div>
      {orders.map((o, oi) => (
        <OrderCard key={o.id} order={o} delay={oi * 80} />
      ))}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-lg py-20 text-center">{children}</div>;
}

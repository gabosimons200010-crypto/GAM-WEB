'use client';

import { Suspense, useEffect, useState, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackOrder, ClientApiError } from '@/lib/client-api';
import type { OrderView } from '@/lib/types';
import { OrderCard } from '@/components/OrderCard';

export default function RastrearPage() {
  return (
    <Suspense fallback={null}>
      <Rastrear />
    </Suspense>
  );
}

function Rastrear() {
  const params = useSearchParams();
  const [number, setNumber] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<OrderView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Prefill desde el enlace de confirmación (?number=…&email=…).
  useEffect(() => {
    const n = params.get('number');
    const e = params.get('email');
    if (n) setNumber(n);
    if (e) setEmail(e);
  }, [params]);

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    setError(null);
    setBusy(true);
    try {
      setOrder(await trackOrder(number.trim(), email.trim()));
    } catch (err) {
      setOrder(null);
      setError(err instanceof ClientApiError ? err.message : 'No pudimos consultar el pedido');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="border-b border-line pb-3 font-display text-3xl text-ink">Rastrear pedido</h1>
      <p className="microcaps mt-4 text-[11px] leading-relaxed text-muted">
        Consulta el estado de tu pedido con su número y el correo con el que lo hiciste. No necesitas cuenta.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <label className="block">
          <span className="microcaps mb-2 block text-muted">Número de pedido</span>
          <input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            required
            placeholder="EJ. GG-A5EBB38C"
            className="microcaps w-full border-b border-line bg-transparent pb-1.5 uppercase text-ink placeholder:text-line focus:border-ink focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="microcaps mb-2 block text-muted">Correo</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="tu@correo.com"
            className="w-full border-b border-line bg-transparent pb-1.5 text-[13px] text-ink placeholder:text-line focus:border-ink focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="microcaps w-full bg-ink px-4 py-3.5 text-paper hover:opacity-80 disabled:opacity-50"
        >
          {busy ? 'Consultando…' : 'Rastrear pedido'}
        </button>
      </form>

      {error && <p className="microcaps mt-6 text-sale">{error}</p>}

      {order && (
        <div className="mt-10">
          <OrderCard order={order} />
        </div>
      )}
    </div>
  );
}

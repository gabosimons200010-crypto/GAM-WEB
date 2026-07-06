'use client';

import { useEffect, useMemo, useState } from 'react';
import { listSellerOrders, ClientApiError } from '@/lib/client-api';
import type { SellerSubOrder } from '@/lib/types';
import { money } from '@/lib/format';

// En tránsito = pagado pero aún no entregado; liquidable = entregado.
const IN_TRANSIT = new Set(['PAID', 'PREPARING', 'READY_FOR_PICKUP', 'SHIPPED']);
const PAYABLE = 'DELIVERED';

export default function SellerPayoutsPage() {
  const [orders, setOrders] = useState<SellerSubOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requested, setRequested] = useState(false);
  const [yape, setYape] = useState('');

  useEffect(() => {
    listSellerOrders()
      .then((r) => setOrders(r.items))
      .catch((e) => setError(e instanceof ClientApiError ? e.message : 'No pudimos cargar tus pagos'));
  }, []);

  const calc = useMemo(() => {
    const all = orders ?? [];
    const delivered = all.filter((o) => o.status === PAYABLE);
    const transit = all.filter((o) => IN_TRANSIT.has(o.status));

    const sum = (list: SellerSubOrder[]) => ({
      gross: list.reduce((a, o) => a + o.subtotal, 0),
      commission: list.reduce((a, o) => a + o.commission, 0),
    });
    const d = sum(delivered);
    const t = sum(transit);
    return {
      delivered,
      payableGross: d.gross,
      payableCommission: d.commission,
      payableNet: d.gross - d.commission,
      transitNet: t.gross - t.commission,
      transitCount: transit.length,
    };
  }, [orders]);

  if (error) return <p className="microcaps text-sale">{error}</p>;
  if (orders === null) return <p className="microcaps text-muted">Cargando pagos…</p>;

  return (
    <div className="space-y-10">
      <h1 className="border-b border-line pb-3 font-display text-3xl text-ink">Pagos y liquidaciones</h1>

      {/* Saldo a liquidar */}
      <div className="border border-ink p-6">
        <p className="microcaps text-muted">Disponible para liquidar (pedidos entregados)</p>
        <p className="mt-2 font-display text-5xl text-ink">{money(calc.payableNet)}</p>
        <p className="microcaps mt-3 text-[10px] text-muted">
          Bruto {money(calc.payableGross)} − comisión 10% {money(calc.payableCommission)}
        </p>

        <div className="mt-6 border-t border-line pt-5">
          <p className="microcaps mb-3 text-muted">Liquidar por Yape</p>
          {requested ? (
            <p className="microcaps text-ink">
              Solicitud enviada ✓ — te depositaremos {money(calc.payableNet)} al Yape {yape || '(número guardado)'} en 24–48 h.
              <span className="block text-[10px] text-muted">Demo — no se movió dinero real.</span>
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <input
                value={yape}
                onChange={(e) => setYape(e.target.value)}
                placeholder="NÚMERO YAPE (9 DÍGITOS)"
                inputMode="numeric"
                className="microcaps w-56 border-b border-line bg-transparent pb-1 text-ink placeholder:text-line focus:border-ink focus:outline-none"
              />
              <button
                onClick={() => setRequested(true)}
                disabled={calc.payableNet <= 0}
                className="microcaps bg-ink px-8 py-3.5 text-paper transition hover:opacity-80 disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
              >
                Solicitar liquidación
              </button>
            </div>
          )}
        </div>
      </div>

      {calc.transitCount > 0 && (
        <p className="microcaps text-muted">
          En tránsito (aún no liquidable):{' '}
          <span className="text-ink">{money(calc.transitNet)}</span> en {calc.transitCount} pedido(s) por entregar.
        </p>
      )}

      {/* Detalle de pedidos entregados */}
      <section>
        <p className="microcaps mb-4 border-b border-line pb-2 text-muted">Pedidos entregados</p>
        {calc.delivered.length === 0 ? (
          <p className="microcaps text-muted">Aún no hay pedidos entregados para liquidar.</p>
        ) : (
          <div className="border-t border-line">
            <div className="hidden gap-4 border-b border-line py-2 sm:flex">
              <span className="microcaps flex-1 text-muted">Pedido</span>
              <span className="microcaps w-28 text-right text-muted">Bruto</span>
              <span className="microcaps w-28 text-right text-muted">Comisión</span>
              <span className="microcaps w-28 text-right text-muted">Neto</span>
            </div>
            {calc.delivered.map((o) => (
              <div key={o.id} className="flex flex-wrap items-baseline gap-4 border-b border-line py-3">
                <span className="microcaps flex-1 text-ink">
                  {o.orderNumber}
                  <span className="block text-[10px] text-muted">{new Date(o.createdAt).toLocaleDateString('es-PE')}</span>
                </span>
                <span className="microcaps w-28 text-right text-muted">{money(o.subtotal)}</span>
                <span className="microcaps w-28 text-right text-muted">−{money(o.commission)}</span>
                <span className="microcaps w-28 text-right text-ink">{money(o.subtotal - o.commission)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="microcaps text-[10px] text-muted">
        La comisión del marketplace es 10% por pedido (se calcula en el checkout). El pago al vendedor por Yape es una demo:
        no hay desembolso real ni pasarela de payout conectada.
      </p>
    </div>
  );
}

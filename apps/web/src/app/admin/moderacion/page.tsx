'use client';

import { useEffect, useState } from 'react';
import { adminListModeration, adminApproveProduct, adminRejectProduct, ClientApiError } from '@/lib/client-api';
import type { ProductDetail } from '@/lib/types';
import { money } from '@/lib/format';

export default function AdminModerationPage() {
  const [products, setProducts] = useState<ProductDetail[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  function load() {
    setProducts(null);
    adminListModeration()
      .then((r) => setProducts(r.items))
      .catch((e) => setError(e instanceof ClientApiError ? e.message : 'No pudimos cargar la cola'));
  }

  useEffect(load, []);

  async function act(id: string, fn: () => Promise<unknown>) {
    setBusy(id);
    setError(null);
    try {
      await fn();
      setProducts((prev) => (prev ? prev.filter((p) => p.id !== id) : prev));
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : 'No se pudo completar la acción');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-line pb-3">
        <h1 className="font-display text-3xl text-ink">Moderación</h1>
        <p className="microcaps mt-2 text-muted">Productos en revisión esperando aprobación para publicarse.</p>
      </div>

      {error && <p className="microcaps text-sale">{error}</p>}

      {products === null ? (
        <p className="microcaps text-muted">Cargando…</p>
      ) : products.length === 0 ? (
        <div className="border border-dashed border-line p-12 text-center">
          <p className="font-display text-2xl text-ink">Nada por revisar</p>
          <p className="microcaps mt-3 text-muted">No hay productos en la cola de moderación.</p>
        </div>
      ) : (
        <div className="border-t border-line">
          {products.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-4 border-b border-line py-4">
              <div className="h-20 w-16 shrink-0 overflow-hidden bg-[#f4f4f4]">
                {p.media[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.media[0].url} alt={p.name} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1">
                <p className="microcaps text-ink">{p.name}</p>
                <p className="microcaps text-[10px] text-muted">
                  {money(p.salePrice ?? p.price)} · {p.variants.length} variante(s) ·{' '}
                  {p.variants.reduce((a, v) => a + v.available, 0)} en stock
                </p>
                {p.description && <p className="mt-1 line-clamp-2 text-[12px] text-muted">{p.description}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => act(p.id, () => adminApproveProduct(p.id))}
                  disabled={busy === p.id}
                  className="microcaps bg-ink px-3 py-1.5 text-paper hover:opacity-80 disabled:opacity-50"
                >
                  Aprobar
                </button>
                <button
                  onClick={() => {
                    const reason = window.prompt('Motivo del rechazo:') ?? '';
                    if (reason.trim()) void act(p.id, () => adminRejectProduct(p.id, reason.trim()));
                  }}
                  disabled={busy === p.id}
                  className="microcaps border border-line px-3 py-1.5 text-sale transition hover:border-sale disabled:opacity-50"
                >
                  Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

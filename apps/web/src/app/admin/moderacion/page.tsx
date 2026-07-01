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
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Moderación de productos</h1>
      <p className="text-sm text-gray-500">Productos en revisión esperando aprobación para publicarse.</p>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {products === null ? (
        <p className="text-gray-500">Cargando…</p>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          <p className="text-3xl">✅</p>
          <p className="mt-2 font-medium">No hay productos por revisar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white p-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {p.media[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.media[0].url} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl text-gray-300">👕</div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{p.name}</p>
                <p className="text-xs text-gray-400">
                  {money(p.salePrice ?? p.price)} · {p.variants.length} variante(s) ·{' '}
                  {p.variants.reduce((a, v) => a + v.available, 0)} en stock
                </p>
                {p.description && <p className="mt-1 line-clamp-2 text-xs text-gray-500">{p.description}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => act(p.id, () => adminApproveProduct(p.id))}
                  disabled={busy === p.id}
                  className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-60"
                >
                  Aprobar
                </button>
                <button
                  onClick={() => {
                    const reason = window.prompt('Motivo del rechazo:') ?? '';
                    if (reason.trim()) void act(p.id, () => adminRejectProduct(p.id, reason.trim()));
                  }}
                  disabled={busy === p.id}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60"
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

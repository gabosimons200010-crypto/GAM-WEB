'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getMyStores, ClientApiError } from '@/lib/client-api';
import type { SellerStore } from '@/lib/types';

const STORE_STATUS: Record<string, string> = {
  DRAFT: 'Borrador',
  IN_REVIEW: 'En revisión',
  APPROVED: 'Aprobada',
  SUSPENDED: 'Suspendida',
  REJECTED: 'Rechazada',
};

export default function SellerHome() {
  const [stores, setStores] = useState<SellerStore[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyStores()
      .then(setStores)
      .catch((e) => setError(e instanceof ClientApiError ? e.message : 'No pudimos cargar tus tiendas'));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-baseline justify-between border-b border-line pb-3">
        <h1 className="font-display text-3xl text-ink">Mis tiendas</h1>
        <Link href="/vendedor/tienda-nueva" className="microcaps border-b border-ink pb-0.5 text-ink hover:opacity-70">
          + Nueva tienda
        </Link>
      </div>

      {error && <p className="microcaps text-sale">{error}</p>}

      {stores === null ? (
        <p className="microcaps text-muted">Cargando…</p>
      ) : stores.length === 0 ? (
        <div className="border border-dashed border-line p-12 text-center">
          <p className="font-display text-2xl text-ink">Aún no tienes tiendas</p>
          <p className="microcaps mt-3 text-muted">Registra tu tienda de Gamarra para empezar a vender.</p>
          <Link
            href="/vendedor/tienda-nueva"
            className="microcaps mt-6 inline-block bg-ink px-8 py-3.5 text-paper hover:opacity-80"
          >
            Registrar mi tienda
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {stores.map((s) => (
            <div key={s.id} className="border border-line p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-xl text-ink">{s.commercialName}</h2>
                <span className="microcaps text-muted">{STORE_STATUS[s.status] ?? s.status}</span>
              </div>
              <p className="microcaps mt-2 text-muted">
                {[s.floor && `Piso ${s.floor}`, s.stand && `Stand ${s.stand}`].filter(Boolean).join(' · ') || 'Gamarra, Lima'}
                {' · '}
                {s.salesCount} ventas
                {s.verified && ' · Verificada'}
              </p>
              {s.status !== 'APPROVED' && (
                <p className="microcaps mt-3 border border-line px-3 py-2 text-[10px] text-muted">
                  Tu tienda debe ser aprobada por un admin antes de vender.
                </p>
              )}
              <div className="microcaps mt-4 flex gap-5">
                <Link href="/vendedor/productos" className="border-b border-ink pb-0.5 text-ink hover:opacity-70">
                  Productos
                </Link>
                <Link href="/vendedor/ventas" className="border-b border-ink pb-0.5 text-ink hover:opacity-70">
                  Ventas
                </Link>
                <Link href={`/tienda/${s.slug}`} className="text-muted hover:text-ink">
                  Ver pública
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

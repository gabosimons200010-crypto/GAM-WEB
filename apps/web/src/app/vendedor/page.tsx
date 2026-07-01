'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getMyStores, ClientApiError } from '@/lib/client-api';
import type { SellerStore } from '@/lib/types';
import { statusColor, statusLabel } from '@/lib/format';

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis tiendas</h1>
        <Link href="/vendedor/tienda-nueva" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">
          + Nueva tienda
        </Link>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {stores === null ? (
        <p className="text-gray-500">Cargando…</p>
      ) : stores.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          <p className="text-3xl">🏬</p>
          <p className="mt-2 font-medium">Aún no tienes tiendas</p>
          <p className="mt-1 text-sm">Registra tu tienda de Gamarra para empezar a vender.</p>
          <Link href="/vendedor/tienda-nueva" className="mt-5 inline-block rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600">
            Registrar mi tienda
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {stores.map((s) => (
            <div key={s.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">{s.commercialName}</h2>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor(s.status === 'APPROVED' ? 'PAID' : s.status)}`}>
                  {STORE_STATUS[s.status] ?? s.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {[s.floor && `Piso ${s.floor}`, s.stand && `Stand ${s.stand}`].filter(Boolean).join(' · ') || 'Gamarra, Lima'}
                {' · '}
                {s.salesCount} ventas
              </p>
              {s.status !== 'APPROVED' && (
                <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-700">
                  Tu tienda debe ser aprobada por un admin antes de vender.
                </p>
              )}
              <div className="mt-4 flex gap-3 text-sm">
                <Link href="/vendedor/productos" className="font-semibold text-brand-600 hover:underline">
                  Productos →
                </Link>
                <Link href={`/tienda/${s.slug}`} className="text-gray-500 hover:text-brand-600">
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

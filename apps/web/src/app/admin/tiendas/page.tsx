'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  adminListStores,
  adminApproveStore,
  adminVerifyStore,
  adminRejectStore,
  ClientApiError,
} from '@/lib/client-api';
import type { AdminStore } from '@/lib/types';

const TABS: { value: string; label: string }[] = [
  { value: 'IN_REVIEW', label: 'En revisión' },
  { value: 'APPROVED', label: 'Aprobadas' },
  { value: '', label: 'Todas' },
];

const STORE_STATUS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: 'Borrador', cls: 'bg-gray-100 text-gray-600' },
  IN_REVIEW: { label: 'En revisión', cls: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: 'Aprobada', cls: 'bg-green-100 text-green-700' },
  SUSPENDED: { label: 'Suspendida', cls: 'bg-red-100 text-red-700' },
  REJECTED: { label: 'Rechazada', cls: 'bg-red-100 text-red-700' },
};

export default function AdminStoresPage() {
  const [tab, setTab] = useState('IN_REVIEW');
  const [stores, setStores] = useState<AdminStore[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStores(null);
    try {
      const r = await adminListStores(tab || undefined);
      setStores(r.items);
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : 'No pudimos cargar las tiendas');
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(id: string, fn: () => Promise<unknown>) {
    setBusy(id);
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : 'No se pudo completar la acción');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Tiendas</h1>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium ${
              tab === t.value ? 'bg-brand-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {stores === null ? (
        <p className="text-gray-500">Cargando…</p>
      ) : stores.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          No hay tiendas en este estado.
        </div>
      ) : (
        <div className="space-y-3">
          {stores.map((s) => {
            const st = STORE_STATUS[s.status] ?? { label: s.status, cls: 'bg-gray-100 text-gray-600' };
            return (
              <div key={s.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 font-bold">
                      {s.commercialName}
                      {s.verified && <span title="Verificada" className="text-brand-600">✔️</span>}
                    </p>
                    <p className="text-xs text-gray-500">
                      {s.ruc ? `RUC ${s.ruc} · ` : ''}
                      {s.email} · {s.phone}
                    </p>
                    <p className="text-xs text-gray-400">
                      {[s.floor && `Piso ${s.floor}`, s.stand && `Stand ${s.stand}`].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                  {s.status !== 'APPROVED' && (
                    <Action onClick={() => act(s.id, () => adminApproveStore(s.id))} busy={busy === s.id} color="green">
                      Aprobar
                    </Action>
                  )}
                  {s.status === 'APPROVED' && (
                    <Action onClick={() => act(s.id, () => adminVerifyStore(s.id, !s.verified))} busy={busy === s.id} color="brand">
                      {s.verified ? 'Quitar verificación' : 'Verificar'}
                    </Action>
                  )}
                  {s.status !== 'REJECTED' && (
                    <Action
                      onClick={() => {
                        const reason = window.prompt('Motivo del rechazo:') ?? '';
                        if (reason.trim()) void act(s.id, () => adminRejectStore(s.id, reason.trim()));
                      }}
                      busy={busy === s.id}
                      color="red"
                    >
                      Rechazar
                    </Action>
                  )}
                </div>
                {s.status === 'APPROVED' && !s.verified && (
                  <p className="mt-2 text-xs text-amber-600">
                    💡 Verifica la tienda para que sus productos se publiquen directo (sin cola de moderación).
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Action({
  children,
  onClick,
  busy,
  color,
}: {
  children: React.ReactNode;
  onClick: () => void;
  busy: boolean;
  color: 'green' | 'red' | 'brand';
}) {
  const cls = {
    green: 'bg-green-600 hover:bg-green-700',
    red: 'bg-red-600 hover:bg-red-700',
    brand: 'bg-brand-500 hover:bg-brand-600',
  }[color];
  return (
    <button onClick={onClick} disabled={busy} className={`rounded-lg px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60 ${cls}`}>
      {children}
    </button>
  );
}

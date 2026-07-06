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

const STORE_STATUS: Record<string, string> = {
  DRAFT: 'Borrador',
  IN_REVIEW: 'En revisión',
  APPROVED: 'Aprobada',
  SUSPENDED: 'Suspendida',
  REJECTED: 'Rechazada',
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
    <div className="space-y-6">
      <h1 className="border-b border-line pb-3 font-display text-3xl text-ink">Tiendas</h1>

      <div className="flex gap-6">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`microcaps border-b-2 pb-1 transition ${
              tab === t.value ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="microcaps text-sale">{error}</p>}

      {stores === null ? (
        <p className="microcaps text-muted">Cargando…</p>
      ) : stores.length === 0 ? (
        <div className="border border-dashed border-line p-10 text-center">
          <p className="microcaps text-muted">No hay tiendas en este estado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stores.map((s) => (
            <div key={s.id} className="border border-line p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xl text-ink">
                    {s.commercialName}
                    {s.verified && <span className="microcaps ml-2 text-muted">· Verificada</span>}
                  </p>
                  <p className="microcaps mt-1 text-[10px] text-muted">
                    {s.ruc ? `RUC ${s.ruc} · ` : ''}
                    {s.email} · {s.phone}
                  </p>
                  <p className="microcaps text-[10px] text-muted">
                    {[s.floor && `Piso ${s.floor}`, s.stand && `Stand ${s.stand}`].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span className="microcaps text-ink">{STORE_STATUS[s.status] ?? s.status}</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                {s.status !== 'APPROVED' && (
                  <button
                    onClick={() => act(s.id, () => adminApproveStore(s.id))}
                    disabled={busy === s.id}
                    className="microcaps bg-ink px-3 py-1.5 text-paper hover:opacity-80 disabled:opacity-50"
                  >
                    Aprobar
                  </button>
                )}
                {s.status === 'APPROVED' && (
                  <button
                    onClick={() => act(s.id, () => adminVerifyStore(s.id, !s.verified))}
                    disabled={busy === s.id}
                    className="microcaps border border-line px-3 py-1.5 text-ink transition hover:border-ink disabled:opacity-50"
                  >
                    {s.verified ? 'Quitar verificación' : 'Verificar'}
                  </button>
                )}
                {s.status !== 'REJECTED' && (
                  <button
                    onClick={() => {
                      const reason = window.prompt('Motivo del rechazo:') ?? '';
                      if (reason.trim()) void act(s.id, () => adminRejectStore(s.id, reason.trim()));
                    }}
                    disabled={busy === s.id}
                    className="microcaps border border-line px-3 py-1.5 text-sale transition hover:border-sale disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                )}
              </div>
              {s.status === 'APPROVED' && !s.verified && (
                <p className="microcaps mt-3 text-[10px] text-muted">
                  Verifica la tienda para que sus productos se publiquen directo (sin cola de moderación).
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

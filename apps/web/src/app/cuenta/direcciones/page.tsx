'use client';

import Link from 'next/link';
import { useEffect, useState, FormEvent } from 'react';
import { useAuth } from '@/lib/auth-context';
import { listAddresses, createAddress, deleteAddress, setDefaultAddress, ClientApiError } from '@/lib/client-api';
import type { Address, CreateAddressBody } from '@/lib/client-api';

const EMPTY: CreateAddressBody = { department: 'Lima', province: 'Lima', district: '', line: '', reference: '', phone: '' };

export default function AddressesPage() {
  const { user, ready } = useAuth();
  const [items, setItems] = useState<Address[] | null>(null);
  const [form, setForm] = useState<CreateAddressBody>(EMPTY);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    listAddresses()
      .then(setItems)
      .catch((e) => setError(e instanceof ClientApiError ? e.message : 'No pudimos cargar tus direcciones'));
  }
  useEffect(() => {
    if (ready && user) load();
    else if (ready) setItems([]);
  }, [ready, user]);

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createAddress({ ...form, reference: form.reference || undefined, phone: form.phone || undefined });
      setForm(EMPTY);
      setAdding(false);
      load();
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : 'No se pudo guardar');
    } finally {
      setBusy(false);
    }
  }

  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      load();
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : 'No se pudo completar');
    } finally {
      setBusy(false);
    }
  }

  if (ready && !user) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <h1 className="font-display text-3xl text-ink">Inicia sesión para ver tus direcciones</h1>
        <Link href="/ingresar?next=/cuenta/direcciones" className="microcaps mt-8 inline-block bg-ink px-10 py-3.5 text-paper hover:opacity-80">
          Ingresar
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
        <h1 className="font-display text-3xl text-ink">Mis direcciones</h1>
        <Link href="/mis-ordenes" className="microcaps text-muted hover:text-ink">Mis pedidos</Link>
      </div>

      {error && <p className="microcaps text-sale">{error}</p>}
      {items === null ? (
        <p className="microcaps text-muted">Cargando…</p>
      ) : items.length === 0 && !adding ? (
        <p className="microcaps text-muted">Aún no guardaste direcciones.</p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {items.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="text-[14px] text-ink">
                  {a.line}
                  {a.isDefault && <span className="microcaps ml-2 text-muted">· Predeterminada</span>}
                </p>
                <p className="microcaps text-[10px] text-muted">
                  {[a.district, a.province, a.department].filter(Boolean).join(', ')}
                  {a.phone && ` · ${a.phone}`}
                </p>
              </div>
              <div className="flex gap-3">
                {!a.isDefault && (
                  <button onClick={() => act(() => setDefaultAddress(a.id))} disabled={busy} className="microcaps text-muted hover:text-ink disabled:opacity-40">
                    Hacer predeterminada
                  </button>
                )}
                <button onClick={() => act(() => deleteAddress(a.id))} disabled={busy} className="microcaps text-sale hover:opacity-70 disabled:opacity-40">
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <form onSubmit={onAdd} className="space-y-5 border border-line p-5">
          <p className="microcaps text-muted">Nueva dirección</p>
          <div className="grid grid-cols-2 gap-5">
            <Field label="Departamento" value={form.department} onChange={(v) => setForm({ ...form, department: v })} />
            <Field label="Provincia" value={form.province} onChange={(v) => setForm({ ...form, province: v })} />
          </div>
          <Field label="Distrito" value={form.district} onChange={(v) => setForm({ ...form, district: v })} />
          <Field label="Dirección" value={form.line} onChange={(v) => setForm({ ...form, line: v })} placeholder="Jr. Gamarra 123" />
          <div className="grid grid-cols-2 gap-5">
            <Field label="Referencia (opcional)" value={form.reference ?? ''} onChange={(v) => setForm({ ...form, reference: v })} required={false} />
            <Field label="Celular (opcional)" value={form.phone ?? ''} onChange={(v) => setForm({ ...form, phone: v })} required={false} />
          </div>
          <div className="flex gap-4">
            <button type="submit" disabled={busy} className="microcaps bg-ink px-6 py-2.5 text-paper hover:opacity-80 disabled:opacity-50">
              {busy ? 'Guardando…' : 'Guardar'}
            </button>
            <button type="button" onClick={() => setAdding(false)} className="microcaps text-muted hover:text-ink">
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setAdding(true)} className="microcaps border-b border-ink pb-0.5 text-ink hover:opacity-70">
          + Agregar dirección
        </button>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="microcaps mb-2 block text-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full border-b border-line bg-transparent pb-1.5 text-[13px] text-ink placeholder:text-line focus:border-ink focus:outline-none"
      />
    </label>
  );
}

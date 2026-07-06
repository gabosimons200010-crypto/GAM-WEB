'use client';

import { useRouter } from 'next/navigation';
import { useState, FormEvent } from 'react';
import { registerStore, ClientApiError, RegisterStoreBody } from '@/lib/client-api';

export default function NewStorePage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterStoreBody>({ commercialName: '', email: '', phone: '', floor: '', stand: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof RegisterStoreBody>(key: K, value: RegisterStoreBody[K]) {
    setForm({ ...form, [key]: value });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await registerStore({
        commercialName: form.commercialName,
        email: form.email,
        phone: form.phone,
        floor: form.floor || undefined,
        stand: form.stand || undefined,
      });
      router.push('/vendedor');
      router.refresh();
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : 'No se pudo registrar la tienda');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-8 border-b border-line pb-3 font-display text-3xl text-ink">Registrar tienda</h1>
      <form onSubmit={onSubmit} className="space-y-6">
        <Field label="Nombre comercial" value={form.commercialName} onChange={(v) => set('commercialName', v)} placeholder="Modas Karla" />
        <Field label="Correo de contacto" type="email" value={form.email} onChange={(v) => set('email', v)} placeholder="contacto@tienda.pe" />
        <Field label="Celular" value={form.phone} onChange={(v) => set('phone', v)} placeholder="987654321" />
        <div className="grid grid-cols-2 gap-6">
          <Field label="Piso (opcional)" value={form.floor ?? ''} onChange={(v) => set('floor', v)} required={false} placeholder="2" />
          <Field label="Stand (opcional)" value={form.stand ?? ''} onChange={(v) => set('stand', v)} required={false} placeholder="A-123" />
        </div>

        {error && <p className="microcaps text-sale">{error}</p>}

        <p className="microcaps border border-line px-3 py-2 text-[10px] text-muted">
          Tras registrarla, un administrador debe aprobarla antes de que puedas publicar productos.
        </p>

        <button
          type="submit"
          disabled={busy}
          className="microcaps w-full bg-ink px-4 py-3.5 text-paper transition hover:opacity-80 disabled:opacity-50"
        >
          {busy ? 'Registrando…' : 'Registrar tienda'}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="microcaps mb-2 block text-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full border-b border-line bg-transparent pb-1.5 text-[13px] text-ink placeholder:text-line focus:border-ink focus:outline-none"
      />
    </label>
  );
}

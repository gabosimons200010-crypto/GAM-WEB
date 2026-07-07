'use client';

import { useRouter } from 'next/navigation';
import { useState, FormEvent } from 'react';
import { registerStore, ClientApiError, RegisterStoreBody } from '@/lib/client-api';

export default function NewStorePage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterStoreBody>({
    commercialName: '',
    legalName: '',
    ruc: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    floor: '',
    stand: '',
  });
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
      const trimmed = (v?: string) => (v && v.trim() ? v.trim() : undefined);
      await registerStore({
        commercialName: form.commercialName.trim(),
        legalName: trimmed(form.legalName),
        ruc: trimmed(form.ruc),
        contactName: trimmed(form.contactName),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: trimmed(form.address),
        floor: trimmed(form.floor),
        stand: trimmed(form.stand),
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
      <form onSubmit={onSubmit} className="space-y-8">
        {/* Datos de la empresa */}
        <fieldset className="space-y-6">
          <legend className="microcaps mb-2 text-muted">Datos de la empresa</legend>
          <Field label="Nombre comercial" value={form.commercialName} onChange={(v) => set('commercialName', v)} placeholder="Modas Karla" />
          <Field label="Razón social (opcional)" value={form.legalName ?? ''} onChange={(v) => set('legalName', v)} required={false} placeholder="Inversiones Karla S.A.C." />
          <div className="grid grid-cols-2 gap-6">
            <Field label="RUC (opcional)" value={form.ruc ?? ''} onChange={(v) => set('ruc', v)} required={false} placeholder="20123456789" />
            <Field label="Persona a cargo" value={form.contactName ?? ''} onChange={(v) => set('contactName', v)} required={false} placeholder="Karla Ramírez" />
          </div>
        </fieldset>

        {/* Contacto y ubicación */}
        <fieldset className="space-y-6">
          <legend className="microcaps mb-2 text-muted">Contacto y ubicación</legend>
          <Field label="Correo de contacto" type="email" value={form.email} onChange={(v) => set('email', v)} placeholder="contacto@tienda.pe" />
          <Field label="Celular" value={form.phone} onChange={(v) => set('phone', v)} placeholder="987654321" />
          <Field label="Dirección (opcional)" value={form.address ?? ''} onChange={(v) => set('address', v)} required={false} placeholder="Jr. Gamarra 123, La Victoria" />
          <div className="grid grid-cols-2 gap-6">
            <Field label="Piso (opcional)" value={form.floor ?? ''} onChange={(v) => set('floor', v)} required={false} placeholder="2" />
            <Field label="Stand (opcional)" value={form.stand ?? ''} onChange={(v) => set('stand', v)} required={false} placeholder="A-123" />
          </div>
        </fieldset>

        {error && <p className="microcaps text-sale">{error}</p>}

        <p className="microcaps border border-line px-3 py-2 text-[10px] text-muted">
          Tras registrarla, un administrador revisa tus datos y la aprueba antes de que puedas publicar productos.
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

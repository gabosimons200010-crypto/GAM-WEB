'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  getMyStores,
  updateStore,
  requestUploadUrl,
  uploadToStorage,
  ClientApiError,
} from '@/lib/client-api';
import type { UpdateStoreBody } from '@/lib/client-api';
import type { SellerStore } from '@/lib/types';

type FormState = {
  commercialName: string;
  legalName: string;
  ruc: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  floor: string;
  stand: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  instagram: string;
  tiktok: string;
  facebook: string;
  web: string;
};

function fromStore(s: SellerStore): FormState {
  const social = (p: string) => s.socials?.find((x) => x.platform === p)?.url ?? '';
  return {
    commercialName: s.commercialName,
    legalName: s.legalName ?? '',
    ruc: s.ruc ?? '',
    contactName: s.contactName ?? '',
    email: s.email ?? '',
    phone: s.phone ?? '',
    address: s.address ?? '',
    floor: s.floor ?? '',
    stand: s.stand ?? '',
    description: s.description ?? '',
    logoUrl: s.logoUrl ?? '',
    bannerUrl: s.bannerUrl ?? '',
    instagram: social('instagram'),
    tiktok: social('tiktok'),
    facebook: social('facebook'),
    web: social('web'),
  };
}

function socialUrl(platform: string, val: string): string | null {
  const v = val.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, '');
  const base: Record<string, string> = {
    instagram: 'https://instagram.com/',
    tiktok: 'https://tiktok.com/@',
    facebook: 'https://facebook.com/',
    web: 'https://',
  };
  return (base[platform] ?? 'https://') + handle;
}

export default function StoreSettingsPage() {
  const [stores, setStores] = useState<SellerStore[] | null>(null);
  const [storeId, setStoreId] = useState('');
  const [form, setForm] = useState<FormState | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<'logoUrl' | 'bannerUrl' | null>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    getMyStores()
      .then((s) => {
        setStores(s);
        if (s.length) {
          setStoreId(s[0].id);
          setForm(fromStore(s[0]));
        }
      })
      .catch((e) => setMsg({ kind: 'err', text: e instanceof ClientApiError ? e.message : 'Error al cargar la tienda' }));
  }, []);

  function selectStore(id: string) {
    const s = stores?.find((x) => x.id === id);
    if (s) {
      setStoreId(id);
      setForm(fromStore(s));
      setMsg(null);
    }
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  async function onUpload(field: 'logoUrl' | 'bannerUrl', file: File) {
    setUploading(field);
    setMsg(null);
    try {
      const { uploadUrl, publicUrl } = await requestUploadUrl(storeId, file.type);
      await uploadToStorage(uploadUrl, file);
      set(field, publicUrl);
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof ClientApiError ? e.message : 'No se pudo subir la imagen' });
    } finally {
      setUploading(null);
    }
  }

  async function save() {
    if (!form) return;
    setBusy(true);
    setMsg(null);
    const trim = (v: string) => (v.trim() ? v.trim() : undefined);
    const socials = [
      ['instagram', form.instagram],
      ['tiktok', form.tiktok],
      ['facebook', form.facebook],
      ['web', form.web],
    ]
      .map(([p, v]) => ({ platform: p, url: socialUrl(p, v) }))
      .filter((s): s is { platform: string; url: string } => !!s.url);

    const body: UpdateStoreBody = {
      commercialName: form.commercialName.trim() || undefined,
      legalName: trim(form.legalName),
      ruc: trim(form.ruc),
      contactName: trim(form.contactName),
      email: trim(form.email),
      phone: trim(form.phone),
      address: trim(form.address),
      floor: trim(form.floor),
      stand: trim(form.stand),
      description: trim(form.description),
      logoUrl: form.logoUrl || undefined,
      bannerUrl: form.bannerUrl || undefined,
      socials,
    };
    try {
      const updated = await updateStore(storeId, body);
      setStores((prev) => prev?.map((s) => (s.id === storeId ? updated : s)) ?? prev);
      setMsg({ kind: 'ok', text: 'Cambios guardados ✓' });
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof ClientApiError ? e.message : 'No se pudo guardar' });
    } finally {
      setBusy(false);
    }
  }

  if (stores === null) return <p className="microcaps text-muted">Cargando…</p>;
  if (stores.length === 0)
    return (
      <div className="border border-dashed border-line p-12 text-center">
        <p className="font-display text-2xl text-ink">Aún no tienes una tienda</p>
        <Link href="/vendedor/tienda-nueva" className="microcaps mt-6 inline-block bg-ink px-8 py-3.5 text-paper hover:opacity-80">
          Registrar tienda
        </Link>
      </div>
    );
  if (!form) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-3">
        <h1 className="font-display text-3xl text-ink">Mi tienda</h1>
        <div className="flex items-center gap-4">
          {stores.length > 1 && (
            <select
              value={storeId}
              onChange={(e) => selectStore(e.target.value)}
              className="border-b border-ink bg-transparent pb-1 text-[12px] text-ink focus:outline-none"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.commercialName}
                </option>
              ))}
            </select>
          )}
          <Link href={`/tienda/${stores.find((s) => s.id === storeId)?.slug ?? ''}`} className="microcaps border-b border-ink pb-0.5 text-ink hover:opacity-70">
            Ver pública →
          </Link>
        </div>
      </div>

      {/* Imágenes */}
      <section className="space-y-5">
        <p className="microcaps text-muted">Imágenes</p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[160px_1fr]">
          <ImagePicker label="Logo" url={form.logoUrl} uploading={uploading === 'logoUrl'} onPick={(f) => onUpload('logoUrl', f)} square />
          <ImagePicker label="Portada" url={form.bannerUrl} uploading={uploading === 'bannerUrl'} onPick={(f) => onUpload('bannerUrl', f)} />
        </div>
      </section>

      {/* Datos de la empresa */}
      <section className="space-y-6">
        <p className="microcaps text-muted">Datos de la empresa</p>
        <Field label="Nombre comercial" value={form.commercialName} onChange={(v) => set('commercialName', v)} />
        <Field label="Razón social" value={form.legalName} onChange={(v) => set('legalName', v)} placeholder="Inversiones Karla S.A.C." />
        <div className="grid grid-cols-2 gap-6">
          <Field label="RUC" value={form.ruc} onChange={(v) => set('ruc', v)} placeholder="20123456789" />
          <Field label="Persona a cargo" value={form.contactName} onChange={(v) => set('contactName', v)} placeholder="Karla Ramírez" />
        </div>
      </section>

      {/* Contacto y ubicación */}
      <section className="space-y-6">
        <p className="microcaps text-muted">Contacto y ubicación</p>
        <div className="grid grid-cols-2 gap-6">
          <Field label="Correo" type="email" value={form.email} onChange={(v) => set('email', v)} />
          <Field label="Celular" value={form.phone} onChange={(v) => set('phone', v)} placeholder="987654321" />
        </div>
        <Field label="Dirección" value={form.address} onChange={(v) => set('address', v)} placeholder="Jr. Gamarra 123, La Victoria" />
        <div className="grid grid-cols-2 gap-6">
          <Field label="Piso" value={form.floor} onChange={(v) => set('floor', v)} placeholder="2" />
          <Field label="Stand" value={form.stand} onChange={(v) => set('stand', v)} placeholder="A-123" />
        </div>
      </section>

      {/* Perfil público */}
      <section className="space-y-6">
        <p className="microcaps text-muted">Perfil público</p>
        <label className="block">
          <span className="microcaps mb-2 block text-muted">Descripción</span>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Cuenta de qué va tu marca…"
            className="w-full resize-none border border-line bg-paper p-2 text-[13px] text-ink focus:border-ink focus:outline-none"
          />
        </label>
        <div className="grid grid-cols-2 gap-6">
          <Field label="Instagram" value={form.instagram} onChange={(v) => set('instagram', v)} placeholder="@mimarca" />
          <Field label="TikTok" value={form.tiktok} onChange={(v) => set('tiktok', v)} placeholder="@mimarca" />
          <Field label="Facebook" value={form.facebook} onChange={(v) => set('facebook', v)} placeholder="mimarca" />
          <Field label="Web" value={form.web} onChange={(v) => set('web', v)} placeholder="mimarca.com" />
        </div>
      </section>

      <div className="flex items-center gap-4 border-t border-line pt-6">
        <button
          onClick={save}
          disabled={busy || !!uploading}
          className="microcaps bg-ink px-8 py-3 text-paper transition hover:opacity-80 disabled:opacity-50"
        >
          {busy ? 'Guardando…' : 'Guardar cambios'}
        </button>
        {msg && <span className={`microcaps ${msg.kind === 'ok' ? 'text-ink' : 'text-sale'}`}>{msg.text}</span>}
      </div>
    </div>
  );
}

function ImagePicker({
  label,
  url,
  uploading,
  onPick,
  square,
}: {
  label: string;
  url: string;
  uploading: boolean;
  onPick: (f: File) => void;
  square?: boolean;
}) {
  return (
    <div>
      <span className="microcaps mb-2 block text-muted">{label}</span>
      <label className={`relative flex cursor-pointer items-center justify-center overflow-hidden border border-line bg-[#f4f4f4] ${square ? 'aspect-square w-full' : 'aspect-[16/7] w-full'}`}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="microcaps text-[10px] text-muted">{uploading ? 'Subiendo…' : 'Subir imagen'}</span>
        )}
        {url && uploading && <span className="absolute inset-0 flex items-center justify-center bg-paper/70 microcaps text-[10px] text-ink">Subiendo…</span>}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(f);
            e.target.value = '';
          }}
        />
      </label>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="microcaps mb-2 block text-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border-b border-line bg-transparent pb-1.5 text-[13px] text-ink placeholder:text-line focus:border-ink focus:outline-none"
      />
    </label>
  );
}

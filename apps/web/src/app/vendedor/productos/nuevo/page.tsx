'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, FormEvent } from 'react';
import { createProduct, ClientApiError } from '@/lib/client-api';
import type { Gender, NewVariantInput } from '@/lib/types';

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'UNISEX', label: 'Unisex' },
  { value: 'HOMBRE', label: 'Hombre' },
  { value: 'MUJER', label: 'Mujer' },
  { value: 'NINO', label: 'Niño' },
  { value: 'NINA', label: 'Niña' },
];

const INPUT = 'w-full border-b border-line bg-transparent pb-1.5 text-[13px] text-ink placeholder:text-line focus:border-ink focus:outline-none';

function NewProductForm() {
  const router = useRouter();
  const storeId = useSearchParams().get('storeId') ?? '';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [gender, setGender] = useState<Gender>('UNISEX');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [tags, setTags] = useState('');
  const [variants, setVariants] = useState<NewVariantInput[]>([{ size: '', color: '', stock: 10 }]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function setVariant(i: number, patch: Partial<NewVariantInput>) {
    setVariants(variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  }
  function addVariant() {
    setVariants([...variants, { size: '', color: '', stock: 10 }]);
  }
  function removeVariant(i: number) {
    setVariants(variants.filter((_, idx) => idx !== i));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!storeId) {
      setError('Falta la tienda. Vuelve a Productos y usa "Nuevo producto".');
      return;
    }
    setBusy(true);
    try {
      await createProduct(storeId, {
        name,
        description: description || undefined,
        gender,
        price: Number(price),
        salePrice: salePrice ? Number(salePrice) : undefined,
        tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
        variants: variants.map((v) => ({
          size: v.size || undefined,
          color: v.color || undefined,
          colorHex: v.colorHex || undefined,
          price: v.price ? Number(v.price) : undefined,
          stock: Number(v.stock),
        })),
      });
      router.push('/vendedor/productos');
      router.refresh();
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : 'No se pudo crear el producto');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 border-b border-line pb-3 font-display text-3xl text-ink">Nuevo producto</h1>
      <form onSubmit={onSubmit} className="space-y-7">
        <label className="block">
          <span className="microcaps mb-2 block text-muted">Nombre</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} className={INPUT} placeholder="Polo oversize algodón pima" />
        </label>

        <label className="block">
          <span className="microcaps mb-2 block text-muted">Descripción (opcional)</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={INPUT} placeholder="Detalles del material, corte, cuidados…" />
        </label>

        <div className="grid grid-cols-2 gap-6">
          <label className="block">
            <span className="microcaps mb-2 block text-muted">Género</span>
            <select value={gender} onChange={(e) => setGender(e.target.value as Gender)} className={INPUT}>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="microcaps mb-2 block text-muted">Tags (separados por coma)</span>
            <input value={tags} onChange={(e) => setTags(e.target.value)} className={INPUT} placeholder="polo, oversize, verano" />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <label className="block">
            <span className="microcaps mb-2 block text-muted">Precio (S/)</span>
            <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required className={INPUT} placeholder="49.90" />
          </label>
          <label className="block">
            <span className="microcaps mb-2 block text-muted">Precio oferta (opcional)</span>
            <input type="number" step="0.01" min="0" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className={INPUT} placeholder="39.90" />
          </label>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="microcaps text-muted">Variantes (talla / color / stock)</span>
            <button type="button" onClick={addVariant} className="microcaps border-b border-ink pb-0.5 text-ink hover:opacity-70">
              + Agregar variante
            </button>
          </div>
          <div className="space-y-3">
            {variants.map((v, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-3">
                <input value={v.size ?? ''} onChange={(e) => setVariant(i, { size: e.target.value })} className={INPUT} placeholder="Talla (M)" />
                <input value={v.color ?? ''} onChange={(e) => setVariant(i, { color: e.target.value })} className={INPUT} placeholder="Color (Negro)" />
                <input
                  type="number"
                  min="0"
                  value={v.stock}
                  onChange={(e) => setVariant(i, { stock: Number(e.target.value) })}
                  className={INPUT}
                  placeholder="Stock"
                />
                <button
                  type="button"
                  onClick={() => removeVariant(i)}
                  disabled={variants.length === 1}
                  className="microcaps px-2 text-muted hover:text-sale disabled:opacity-30"
                  aria-label="Quitar variante"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="microcaps text-sale">{error}</p>}

        <p className="microcaps border border-line px-3 py-2 text-[10px] text-muted">
          Se crea como borrador. Luego lo publicas desde la lista de Productos, o carga fotos con IA para generarlo automáticamente.
        </p>

        <button
          type="submit"
          disabled={busy}
          className="microcaps w-full bg-ink px-4 py-3.5 text-paper transition hover:opacity-80 disabled:opacity-50"
        >
          {busy ? 'Creando…' : 'Crear producto'}
        </button>
      </form>
    </div>
  );
}

export default function NewProductPage() {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-2xl" />}>
      <NewProductForm />
    </Suspense>
  );
}

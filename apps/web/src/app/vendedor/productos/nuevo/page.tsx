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

  const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none';

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Nuevo producto</h1>
      <form onSubmit={onSubmit} className="space-y-5 rounded-xl border border-gray-200 bg-white p-6">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Nombre</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} className={input} placeholder="Polo oversize algodón pima" />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Descripción (opcional)</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={input} placeholder="Detalles del material, corte, cuidados…" />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Género</span>
            <select value={gender} onChange={(e) => setGender(e.target.value as Gender)} className={input}>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Tags (separados por coma)</span>
            <input value={tags} onChange={(e) => setTags(e.target.value)} className={input} placeholder="polo, oversize, verano" />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Precio (S/)</span>
            <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required className={input} placeholder="49.90" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Precio oferta (opcional)</span>
            <input type="number" step="0.01" min="0" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className={input} placeholder="39.90" />
          </label>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Variantes (talla / color / stock)</span>
            <button type="button" onClick={addVariant} className="text-sm font-semibold text-brand-600 hover:underline">
              + Agregar variante
            </button>
          </div>
          <div className="space-y-2">
            {variants.map((v, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2">
                <input value={v.size ?? ''} onChange={(e) => setVariant(i, { size: e.target.value })} className={input} placeholder="Talla (M)" />
                <input value={v.color ?? ''} onChange={(e) => setVariant(i, { color: e.target.value })} className={input} placeholder="Color (Negro)" />
                <input
                  type="number"
                  min="0"
                  value={v.stock}
                  onChange={(e) => setVariant(i, { stock: Number(e.target.value) })}
                  className={input}
                  placeholder="Stock"
                />
                <button
                  type="button"
                  onClick={() => removeVariant(i)}
                  disabled={variants.length === 1}
                  className="px-2 text-gray-400 hover:text-red-500 disabled:opacity-30"
                  aria-label="Quitar variante"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
          Se crea como borrador. Luego lo publicas desde la lista de Productos. (Subir fotos con IA llega en el próximo sprint.)
        </p>

        <button type="submit" disabled={busy} className="w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-60">
          {busy ? 'Creando…' : 'Crear producto'}
        </button>
      </form>
    </div>
  );
}

export default function NewProductPage() {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-2xl rounded-xl bg-white" />}>
      <NewProductForm />
    </Suspense>
  );
}

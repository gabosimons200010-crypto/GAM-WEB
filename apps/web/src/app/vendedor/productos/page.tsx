'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getMyStores, listMyProducts, publishProduct, ClientApiError } from '@/lib/client-api';
import type { ProductDetail, SellerStore } from '@/lib/types';
import { money } from '@/lib/format';

const PRODUCT_STATUS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: 'Borrador', cls: 'bg-gray-100 text-gray-600' },
  IN_REVIEW: { label: 'En revisión', cls: 'bg-amber-100 text-amber-700' },
  ACTIVE: { label: 'Publicado', cls: 'bg-green-100 text-green-700' },
  PAUSED: { label: 'Pausado', cls: 'bg-blue-100 text-blue-700' },
  ARCHIVED: { label: 'Archivado', cls: 'bg-gray-100 text-gray-500' },
  REJECTED: { label: 'Rechazado', cls: 'bg-red-100 text-red-700' },
};

export default function SellerProductsPage() {
  const [stores, setStores] = useState<SellerStore[] | null>(null);
  const [storeId, setStoreId] = useState<string>('');
  const [products, setProducts] = useState<ProductDetail[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);

  useEffect(() => {
    getMyStores()
      .then((s) => {
        setStores(s);
        if (s.length > 0) setStoreId(s[0].id);
      })
      .catch((e) => setError(e instanceof ClientApiError ? e.message : 'Error al cargar tiendas'));
  }, []);

  async function loadProducts(id: string) {
    setProducts(null);
    try {
      const r = await listMyProducts(id);
      setProducts(r.items);
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : 'Error al cargar productos');
    }
  }

  useEffect(() => {
    if (storeId) void loadProducts(storeId);
  }, [storeId]);

  async function onPublish(productId: string) {
    setPublishing(productId);
    setError(null);
    try {
      await publishProduct(storeId, productId);
      await loadProducts(storeId);
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : 'No se pudo publicar');
    } finally {
      setPublishing(null);
    }
  }

  if (stores === null) return <p className="text-gray-500">Cargando…</p>;

  if (stores.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
        <p className="text-3xl">🏬</p>
        <p className="mt-2 font-medium">Primero registra una tienda</p>
        <Link href="/vendedor/tienda-nueva" className="mt-5 inline-block rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600">
          Registrar tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Productos</h1>
        <div className="flex items-center gap-3">
          {stores.length > 1 && (
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.commercialName}
                </option>
              ))}
            </select>
          )}
          <Link href={`/vendedor/productos/nuevo?storeId=${storeId}`} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">
            + Nuevo producto
          </Link>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {products === null ? (
        <p className="text-gray-500">Cargando productos…</p>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          <p className="text-3xl">👕</p>
          <p className="mt-2 font-medium">Aún no tienes productos</p>
          <Link href={`/vendedor/productos/nuevo?storeId=${storeId}`} className="mt-5 inline-block rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600">
            Crear el primero
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => {
                const stock = p.variants.reduce((acc, v) => acc + v.available, 0);
                const st = PRODUCT_STATUS[p.status] ?? { label: p.status, cls: 'bg-gray-100 text-gray-600' };
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.variants.length} variante(s)</p>
                    </td>
                    <td className="px-4 py-3">{money(p.salePrice ?? p.price)}</td>
                    <td className="px-4 py-3">{stock}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(p.status === 'DRAFT' || p.status === 'PAUSED') && (
                        <button
                          onClick={() => onPublish(p.id)}
                          disabled={publishing === p.id}
                          className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-600 disabled:opacity-60"
                        >
                          {publishing === p.id ? 'Publicando…' : 'Publicar'}
                        </button>
                      )}
                      {p.status === 'ACTIVE' && (
                        <Link href={`/producto/${p.slug}`} className="text-xs font-medium text-brand-600 hover:underline">
                          Ver
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

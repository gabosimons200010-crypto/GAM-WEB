'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  getMyStores,
  listMyProducts,
  publishProduct,
  pauseProduct,
  updateProduct,
  adjustInventory,
  ClientApiError,
} from '@/lib/client-api';
import type { UpdateProductInput } from '@/lib/client-api';
import type { ProductDetail, SellerStore, VariantView } from '@/lib/types';
import { money } from '@/lib/format';

const PRODUCT_STATUS: Record<string, string> = {
  DRAFT: 'Borrador',
  IN_REVIEW: 'En revisión',
  ACTIVE: 'Publicado',
  PAUSED: 'Pausado',
  ARCHIVED: 'Archivado',
  REJECTED: 'Rechazado',
};

export default function SellerProductsPage() {
  const [stores, setStores] = useState<SellerStore[] | null>(null);
  const [storeId, setStoreId] = useState<string>('');
  const [products, setProducts] = useState<ProductDetail[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [pausing, setPausing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

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

  async function onPause(productId: string) {
    setPausing(productId);
    setError(null);
    try {
      await pauseProduct(storeId, productId);
      await loadProducts(storeId);
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : 'No se pudo pausar');
    } finally {
      setPausing(null);
    }
  }

  /** Refleja el nuevo stock en el estado local tras guardarlo en el backend. */
  function applyStock(productId: string, variantId: string, available: number) {
    setProducts((prev) =>
      prev
        ? prev.map((p) =>
            p.id === productId
              ? { ...p, variants: p.variants.map((v) => (v.id === variantId ? { ...v, available } : v)) }
              : p,
          )
        : prev,
    );
  }

  if (stores === null) return <p className="microcaps text-muted">Cargando…</p>;

  if (stores.length === 0) {
    return (
      <div className="border border-dashed border-line p-12 text-center">
        <p className="font-display text-2xl text-ink">Primero registra una tienda</p>
        <Link href="/vendedor/tienda-nueva" className="microcaps mt-6 inline-block bg-ink px-8 py-3.5 text-paper hover:opacity-80">
          Registrar tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-3">
        <h1 className="font-display text-3xl text-ink">Productos</h1>
        <div className="flex items-center gap-4">
          {stores.length > 1 && (
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="border-b border-ink bg-transparent pb-1 text-[12px] text-ink focus:outline-none"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.commercialName}
                </option>
              ))}
            </select>
          )}
          <Link
            href={`/vendedor/productos/nuevo?storeId=${storeId}`}
            className="microcaps border-b border-ink pb-0.5 text-ink hover:opacity-70"
          >
            + Nuevo producto
          </Link>
        </div>
      </div>

      {error && <p className="microcaps text-sale">{error}</p>}

      {products === null ? (
        <p className="microcaps text-muted">Cargando productos…</p>
      ) : products.length === 0 ? (
        <div className="border border-dashed border-line p-12 text-center">
          <p className="font-display text-2xl text-ink">Aún no tienes productos</p>
          <Link
            href={`/vendedor/productos/nuevo?storeId=${storeId}`}
            className="microcaps mt-6 inline-block bg-ink px-8 py-3.5 text-paper hover:opacity-80"
          >
            Crear el primero
          </Link>
        </div>
      ) : (
        <div className="border-t border-line">
          {products.map((p) => {
            const stock = p.variants.reduce((acc, v) => acc + v.available, 0);
            const open = expanded === p.id;
            return (
              <div key={p.id} className="border-b border-line">
                <div className="flex items-center gap-4 py-4">
                  <button
                    onClick={() => setExpanded(open ? null : p.id)}
                    className="flex flex-1 items-center gap-4 text-left"
                  >
                    <span className="microcaps w-5 text-muted">{open ? '–' : '+'}</span>
                    <span className="flex-1">
                      <span className="microcaps block text-ink">{p.name}</span>
                      <span className="microcaps block text-[10px] text-muted">
                        {p.variants.length} variante(s) · {money(p.salePrice ?? p.price)}
                      </span>
                    </span>
                    <span className="microcaps w-24 text-right text-muted">{stock} en stock</span>
                    <span className="microcaps w-24 text-right text-ink">{PRODUCT_STATUS[p.status] ?? p.status}</span>
                  </button>
                  <div className="flex shrink-0 items-center justify-end gap-3">
                    {(p.status === 'DRAFT' || p.status === 'PAUSED') && (
                      <button
                        onClick={() => onPublish(p.id)}
                        disabled={publishing === p.id}
                        className="microcaps bg-ink px-3 py-1.5 text-paper hover:opacity-80 disabled:opacity-50"
                      >
                        {publishing === p.id ? '…' : p.status === 'PAUSED' ? 'Reactivar' : 'Publicar'}
                      </button>
                    )}
                    {(p.status === 'ACTIVE' || p.status === 'IN_REVIEW') && (
                      <button
                        onClick={() => onPause(p.id)}
                        disabled={pausing === p.id}
                        className="microcaps border border-line px-3 py-1.5 text-ink transition hover:border-ink disabled:opacity-50"
                      >
                        {pausing === p.id ? '…' : 'Pausar'}
                      </button>
                    )}
                    {p.status === 'ACTIVE' && (
                      <Link href={`/producto/${p.slug}`} className="microcaps border-b border-ink pb-0.5 text-ink hover:opacity-70">
                        Ver
                      </Link>
                    )}
                  </div>
                </div>

                {open && (
                  <div className="space-y-6 border-t border-line bg-[#fafafa] px-2 pb-6 pt-4 sm:px-9">
                    <div>
                      <p className="microcaps mb-3 text-muted">Editar producto</p>
                      <EditProductForm storeId={storeId} product={p} onSaved={() => loadProducts(storeId)} />
                    </div>
                    <div>
                      <p className="microcaps mb-3 text-muted">Ajustar inventario</p>
                      <div className="space-y-2">
                        {p.variants.map((v) => (
                          <InventoryRow
                            key={v.id}
                            storeId={storeId}
                            productId={p.id}
                            variant={v}
                            onSaved={(available) => applyStock(p.id, v.id, available)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EditProductForm({
  storeId,
  product,
  onSaved,
}: {
  storeId: string;
  product: ProductDetail;
  onSaved: () => void | Promise<void>;
}) {
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.price));
  const [salePrice, setSalePrice] = useState(product.salePrice != null ? String(product.salePrice) : '');
  const [description, setDescription] = useState(product.description ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const initialSale = product.salePrice != null ? String(product.salePrice) : '';
  const dirty =
    name.trim() !== product.name ||
    price !== String(product.price) ||
    salePrice !== initialSale ||
    description !== (product.description ?? '');

  async function save() {
    setMsg(null);
    const priceN = Number(price);
    if (!name.trim()) return setMsg({ kind: 'err', text: 'El nombre no puede estar vacío' });
    if (!(priceN > 0)) return setMsg({ kind: 'err', text: 'El precio debe ser mayor a 0' });

    const body: UpdateProductInput = { name: name.trim(), price: priceN, description: description.trim() };
    if (salePrice.trim() !== '') {
      const saleN = Number(salePrice);
      if (!(saleN > 0) || saleN >= priceN) {
        return setMsg({ kind: 'err', text: 'La oferta debe ser mayor a 0 y menor al precio' });
      }
      body.salePrice = saleN;
    }

    setBusy(true);
    try {
      await updateProduct(storeId, product.id, body);
      setMsg({ kind: 'ok', text: 'Guardado ✓' });
      await onSaved();
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof ClientApiError ? e.message : 'No se pudo guardar' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <label className="block">
        <span className="microcaps mb-1 block text-muted">Nombre</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border-b border-line bg-transparent pb-1 text-[13px] text-ink focus:border-ink focus:outline-none"
        />
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="microcaps mb-1 block text-muted">Precio (S/)</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border-b border-line bg-transparent pb-1 text-[13px] text-ink focus:border-ink focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="microcaps mb-1 block text-muted">Oferta (S/, opcional)</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
            placeholder="—"
            className="w-full border-b border-line bg-transparent pb-1 text-[13px] text-ink placeholder:text-line focus:border-ink focus:outline-none"
          />
        </label>
      </div>
      <label className="block">
        <span className="microcaps mb-1 block text-muted">Descripción</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full resize-none border border-line bg-paper p-2 text-[13px] text-ink focus:border-ink focus:outline-none"
        />
      </label>
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={busy || !dirty}
          className="microcaps bg-ink px-4 py-2 text-paper transition hover:opacity-80 disabled:opacity-40"
        >
          {busy ? 'Guardando…' : 'Guardar cambios'}
        </button>
        {msg && <span className={`microcaps ${msg.kind === 'ok' ? 'text-ink' : 'text-sale'}`}>{msg.text}</span>}
      </div>
    </div>
  );
}

function InventoryRow({
  storeId,
  productId,
  variant,
  onSaved,
}: {
  storeId: string;
  productId: string;
  variant: VariantView;
  onSaved: (available: number) => void;
}) {
  const [value, setValue] = useState(String(variant.available));
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<'idle' | 'ok' | 'err'>('idle');
  const [lowStock, setLowStock] = useState(false);

  const dirty = value !== String(variant.available);
  const label = [variant.size, variant.color].filter(Boolean).join(' · ') || variant.sku;

  async function save() {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0) {
      setState('err');
      return;
    }
    setBusy(true);
    setState('idle');
    try {
      const r = await adjustInventory(storeId, variant.id, n);
      setLowStock(r.lowStock);
      onSaved(r.available);
      setState('ok');
      setTimeout(() => setState('idle'), 1500);
    } catch {
      setState('err');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span className="microcaps w-40 shrink-0 text-ink">{label}</span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-24 border-b border-line bg-transparent pb-1 text-[13px] text-ink focus:border-ink focus:outline-none"
      />
      <button
        onClick={save}
        disabled={busy || !dirty}
        className="microcaps border border-line px-3 py-1.5 text-ink transition hover:border-ink disabled:opacity-40"
      >
        {busy ? '…' : 'Guardar'}
      </button>
      {state === 'ok' && <span className="microcaps text-ink">Guardado ✓{lowStock ? ' · stock bajo' : ''}</span>}
      {state === 'err' && <span className="microcaps text-sale">Error</span>}
    </div>
  );
}

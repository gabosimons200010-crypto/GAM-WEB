'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import type { ProductDetail } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { addToCart, ClientApiError } from '@/lib/client-api';
import { addGuestItem } from '@/lib/guest-cart';

/** Selector de variante (talla/color) y acción real de agregar a la cesta. */
export function ProductPurchase({ product }: { product: ProductDetail }) {
  const { user } = useAuth();
  const { refresh } = useCart();
  const variants = product.variants;

  const sizes = useMemo(() => sortSizes(unique(variants.map((v) => v.size))), [variants]);
  const colors = useMemo(() => unique(variants.map((v) => v.color)), [variants]);

  const [size, setSize] = useState<string | null>(sizes.length === 1 ? sizes[0] : null);
  const [color, setColor] = useState<string | null>(colors.length === 1 ? colors[0] : null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [notified, setNotified] = useState(false);

  const selected = variants.find((v) => (size === null || v.size === size) && (color === null || v.color === color));
  const needsSize = sizes.some((s) => s !== null);
  const needsColor = colors.some((c) => c !== null);
  const ready2 = (!needsSize || size !== null) && (!needsColor || color !== null) && !!selected;
  const available = selected?.available ?? 0;
  const soldOut = ready2 && available <= 0;

  /** Sin stock por talla: si TODAS las variantes de esa talla están en cero. */
  function sizeSoldOut(s: string): boolean {
    const ofSize = variants.filter((v) => v.size === s);
    return ofSize.length > 0 && ofSize.every((v) => v.available <= 0);
  }

  async function onAdd() {
    setMsg(null);
    if (!ready2 || !selected) {
      setMsg({ kind: 'err', text: 'Elige talla y color antes de continuar.' });
      return;
    }
    if (available <= 0) {
      setMsg({ kind: 'err', text: 'Esta variante está agotada.' });
      return;
    }
    setBusy(true);
    try {
      if (user) {
        // Con sesión: cesta del servidor.
        await addToCart(selected.id, 1);
        setMsg({ kind: 'ok', text: 'Añadido a la cesta.' });
      } else {
        // Sin cuenta: cesta de invitado (localStorage). No obliga a registrarse.
        addGuestItem(
          {
            variantId: selected.id,
            productId: product.id,
            productSlug: product.slug,
            productName: product.name,
            storeId: product.storeId,
            size: selected.size,
            color: selected.color,
            unitPrice: selected.price ?? product.salePrice ?? product.price,
            thumbnailUrl: product.media[0]?.url ?? null,
            available: selected.available,
          },
          1,
        );
        setMsg({ kind: 'ok', text: 'Añadido a la cesta.' });
      }
      await refresh();
      setAdded(true);
    } catch (err) {
      const text = err instanceof ClientApiError ? err.message : 'No pudimos añadir a la cesta';
      setMsg({ kind: 'err', text });
    } finally {
      setBusy(false);
    }
  }

  function onNotify(e: FormEvent) {
    e.preventDefault();
    setNotified(true); // Captura demo: aún no hay backend de avisos de restock.
  }

  return (
    <div className="space-y-6">
      {needsSize && <Selector label="Talla" options={sizes} value={size} onChange={setSize} isSoldOut={sizeSoldOut} />}
      {needsColor && <Selector label="Color" options={colors} value={color} onChange={setColor} />}

      {ready2 && !soldOut && available <= 5 && (
        <p className="microcaps text-muted">Quedan {available} unidades</p>
      )}

      {soldOut && (
        <form onSubmit={onNotify} className="border-t border-line pt-4">
          <p className="microcaps mb-3 text-ink">{notified ? 'Te avisaremos cuando vuelva.' : 'Agotado — recibe un aviso'}</p>
          {!notified && (
            <div className="flex max-w-xs items-baseline gap-3 border-b border-ink pb-1">
              <input
                type="email"
                required
                placeholder="INTRODUCIR E-MAIL"
                className="microcaps w-full bg-transparent text-ink placeholder:text-muted focus:outline-none"
              />
              <button type="submit" className="microcaps shrink-0 hover:opacity-70">
                Avisarme
              </button>
            </div>
          )}
        </form>
      )}

      <div className="flex flex-wrap items-center gap-5">
        <button
          onClick={onAdd}
          disabled={busy || soldOut}
          className="microcaps min-w-56 bg-ink px-10 py-3.5 text-paper transition hover:opacity-80 disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
        >
          {busy ? 'Añadiendo…' : soldOut ? 'Agotado' : 'Añadir a la cesta'}
        </button>
        {added && (
          <Link href="/carrito" className="microcaps border-b border-ink pb-0.5 hover:opacity-70">
            Ver cesta
          </Link>
        )}
      </div>

      {msg && (
        <p className={`microcaps ${msg.kind === 'ok' ? 'text-ink' : 'text-sale'}`}>{msg.text}</p>
      )}
    </div>
  );
}

function Selector({
  label,
  options,
  value,
  onChange,
  isSoldOut,
}: {
  label: string;
  options: (string | null)[];
  value: string | null;
  onChange: (v: string) => void;
  isSoldOut?: (v: string) => boolean;
}) {
  return (
    <div>
      <p className="microcaps mb-3 text-muted">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options
          .filter((o): o is string => o !== null)
          .map((o) => {
            const out = isSoldOut?.(o) ?? false;
            return (
              <button
                key={o}
                onClick={() => onChange(o)}
                className={`min-w-12 border px-3 py-2.5 text-[12px] ${
                  value === o
                    ? 'border-ink bg-ink text-paper'
                    : out
                      ? 'border-line text-line line-through'
                      : 'border-line text-ink hover:border-ink'
                }`}
              >
                {o}
              </button>
            );
          })}
      </div>
    </div>
  );
}

function unique(values: (string | null)[]): (string | null)[] {
  return [...new Set(values)];
}

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

/** Ordena tallas en el orden canónico; las desconocidas van al final, alfabéticas. */
function sortSizes(values: (string | null)[]): (string | null)[] {
  return [...values].sort((a, b) => {
    const ia = a ? SIZE_ORDER.indexOf(a.toUpperCase()) : -1;
    const ib = b ? SIZE_ORDER.indexOf(b.toUpperCase()) : -1;
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return String(a).localeCompare(String(b));
  });
}

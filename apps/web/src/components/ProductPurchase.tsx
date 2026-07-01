'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { VariantView } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { addToCart, ClientApiError } from '@/lib/client-api';

/** Selector de variante (talla/color) y acción real de agregar al carrito. */
export function ProductPurchase({ variants }: { variants: VariantView[] }) {
  const { user, ready } = useAuth();
  const { refresh } = useCart();
  const router = useRouter();
  const pathname = usePathname();

  const sizes = useMemo(() => unique(variants.map((v) => v.size)), [variants]);
  const colors = useMemo(() => unique(variants.map((v) => v.color)), [variants]);

  const [size, setSize] = useState<string | null>(sizes.length === 1 ? sizes[0] : null);
  const [color, setColor] = useState<string | null>(colors.length === 1 ? colors[0] : null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);

  const selected = variants.find((v) => (size === null || v.size === size) && (color === null || v.color === color));
  const needsSize = sizes.some((s) => s !== null);
  const needsColor = colors.some((c) => c !== null);
  const ready2 = (!needsSize || size !== null) && (!needsColor || color !== null) && !!selected;
  const available = selected?.available ?? 0;

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
    if (ready && !user) {
      router.push(`/ingresar?next=${encodeURIComponent(pathname)}`);
      return;
    }
    setBusy(true);
    try {
      await addToCart(selected.id, 1);
      await refresh();
      setAdded(true);
      setMsg({ kind: 'ok', text: '✅ Agregado al carrito.' });
    } catch (err) {
      const text = err instanceof ClientApiError ? err.message : 'No pudimos agregar al carrito';
      setMsg({ kind: 'err', text });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {needsSize && <Selector label="Talla" options={sizes} value={size} onChange={setSize} />}
      {needsColor && <Selector label="Color" options={colors} value={color} onChange={setColor} />}

      {ready2 && (
        <p className="text-sm">
          {available > 0 ? (
            <span className="text-green-600">{available} disponibles</span>
          ) : (
            <span className="text-red-500">Agotado</span>
          )}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onAdd}
          disabled={busy}
          className="rounded-lg bg-brand-500 px-6 py-3 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {busy ? 'Agregando…' : 'Agregar al carrito'}
        </button>
        {added && (
          <Link href="/carrito" className="text-sm font-semibold text-brand-600 hover:underline">
            Ir al carrito →
          </Link>
        )}
      </div>

      {msg && (
        <p className={`rounded-lg p-3 text-sm ${msg.kind === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}

function Selector({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: (string | null)[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-gray-700">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options
          .filter((o): o is string => o !== null)
          .map((o) => (
            <button
              key={o}
              onClick={() => onChange(o)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                value === o ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              {o}
            </button>
          ))}
      </div>
    </div>
  );
}

function unique(values: (string | null)[]): (string | null)[] {
  return [...new Set(values)];
}

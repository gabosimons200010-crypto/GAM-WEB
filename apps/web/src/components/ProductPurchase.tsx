'use client';

import { useMemo, useState } from 'react';
import type { VariantView } from '@/lib/types';

/**
 * Selector de variante (talla/color) y acción de compra. El carrito real
 * (con sesión) llega en el siguiente sprint del frontend; por ahora valida la
 * selección y avisa.
 */
export function ProductPurchase({ variants }: { variants: VariantView[] }) {
  const sizes = useMemo(() => unique(variants.map((v) => v.size)), [variants]);
  const colors = useMemo(() => unique(variants.map((v) => v.color)), [variants]);

  const [size, setSize] = useState<string | null>(sizes.length === 1 ? sizes[0] : null);
  const [color, setColor] = useState<string | null>(colors.length === 1 ? colors[0] : null);
  const [msg, setMsg] = useState<string | null>(null);

  const selected = variants.find((v) => (size === null || v.size === size) && (color === null || v.color === color));
  const needsSize = sizes.some((s) => s !== null);
  const needsColor = colors.some((c) => c !== null);
  const ready = (!needsSize || size !== null) && (!needsColor || color !== null) && !!selected;
  const available = selected?.available ?? 0;

  function onAdd() {
    if (!ready) {
      setMsg('Elige talla y color antes de continuar.');
      return;
    }
    if (available <= 0) {
      setMsg('Esta variante está agotada.');
      return;
    }
    setMsg('🛒 ¡Listo para agregar! El carrito con sesión llega en el próximo sprint del frontend.');
  }

  return (
    <div className="space-y-4">
      {needsSize && (
        <Selector label="Talla" options={sizes} value={size} onChange={setSize} />
      )}
      {needsColor && (
        <Selector label="Color" options={colors} value={color} onChange={setColor} />
      )}

      {ready && (
        <p className="text-sm text-gray-500">
          {available > 0 ? (
            <span className="text-green-600">{available} disponibles</span>
          ) : (
            <span className="text-red-500">Agotado</span>
          )}
        </p>
      )}

      <button
        onClick={onAdd}
        className="w-full rounded-lg bg-brand-500 px-6 py-3 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50 sm:w-auto"
      >
        Agregar al carrito
      </button>

      {msg && <p className="rounded-lg bg-gray-100 p-3 text-sm text-gray-700">{msg}</p>}
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

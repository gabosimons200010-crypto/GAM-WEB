'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChangeEvent } from 'react';
import type { Gender, SortOption } from '@/lib/types';

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'HOMBRE', label: 'Hombre' },
  { value: 'MUJER', label: 'Mujer' },
  { value: 'NINO', label: 'Niño' },
  { value: 'NINA', label: 'Niña' },
  { value: 'UNISEX', label: 'Unisex' },
];

const SORTS: { value: SortOption; label: string }[] = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'newest', label: 'Más nuevos' },
  { value: 'price_asc', label: 'Menor precio' },
  { value: 'price_desc', label: 'Mayor precio' },
  { value: 'best_selling', label: 'Más vendidos' },
];

/** Filtros del catálogo: escriben en los query params y recargan los resultados. */
export function Filters() {
  const router = useRouter();
  const params = useSearchParams();

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page'); // cualquier cambio de filtro vuelve a la página 1
    router.push(`/buscar?${next.toString()}`);
  }

  const onSelect = (key: string) => (e: ChangeEvent<HTMLSelectElement>) => setParam(key, e.target.value || null);

  const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none';

  return (
    <aside className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Ordenar por</label>
        <select className={inputCls} value={params.get('sort') ?? 'relevance'} onChange={onSelect('sort')}>
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Género</label>
        <select className={inputCls} value={params.get('gender') ?? ''} onChange={onSelect('gender')}>
          <option value="">Todos</option>
          {GENDERS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Precio (S/)</label>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            placeholder="Min"
            defaultValue={params.get('minPrice') ?? ''}
            onBlur={(e) => setParam('minPrice', e.target.value || null)}
            className={inputCls}
          />
          <input
            type="number"
            min={0}
            placeholder="Max"
            defaultValue={params.get('maxPrice') ?? ''}
            onBlur={(e) => setParam('maxPrice', e.target.value || null)}
            className={inputCls}
          />
        </div>
      </div>

      {[...params.keys()].some((k) => ['gender', 'minPrice', 'maxPrice', 'sort', 'category'].includes(k)) && (
        <button
          onClick={() => {
            const q = params.get('q');
            router.push(q ? `/buscar?q=${encodeURIComponent(q)}` : '/buscar');
          }}
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          Limpiar filtros
        </button>
      )}
    </aside>
  );
}

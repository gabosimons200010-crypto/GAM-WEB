'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, FormEvent } from 'react';

/** Buscador del header: navega a /buscar?q=… conservando el término actual. */
export function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState('');

  // Refleja el término de la URL cuando el usuario está en /buscar.
  useEffect(() => {
    setValue(params.get('q') ?? '');
  }, [params]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/buscar?q=${encodeURIComponent(q)}` : '/buscar');
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Busca polos, jeans, casacas…"
        className="w-full rounded-l-lg border border-r-0 border-gray-300 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none"
      />
      <button
        type="submit"
        className="rounded-r-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
      >
        Buscar
      </button>
    </form>
  );
}

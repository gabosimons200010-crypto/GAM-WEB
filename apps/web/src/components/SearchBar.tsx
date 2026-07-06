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
    <form onSubmit={onSubmit} className="flex w-full max-w-md items-baseline gap-3 border-b border-ink pb-1">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="BUSCAR"
        className="microcaps w-full bg-transparent text-ink placeholder:text-muted focus:outline-none"
      />
      <button type="submit" className="microcaps shrink-0 text-ink hover:underline hover:underline-offset-4">
        Ir
      </button>
    </form>
  );
}

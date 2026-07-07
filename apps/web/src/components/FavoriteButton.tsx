'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFavorites } from '@/lib/favorites-context';

/** Corazón grande (detalle de producto) para guardar/quitar de favoritos. Requiere sesión. */
export function FavoriteButton({ productId }: { productId: string }) {
  const { isFavorite, toggle } = useFavorites();
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const fav = isFavorite(productId);

  async function onClick() {
    if (busy) return;
    setBusy(true);
    const hadSession = await toggle(productId);
    setBusy(false);
    if (!hadSession) router.push(`/ingresar?next=${encodeURIComponent(pathname)}`);
  }

  return (
    <button
      onClick={onClick}
      disabled={busy}
      aria-pressed={fav}
      className="microcaps flex items-center justify-center gap-2 border border-line px-6 py-3.5 text-ink transition hover:border-ink disabled:opacity-50"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6">
        <path d="M12 21s-7.5-4.6-10-9.2C.6 8.9 2 5.5 5.2 5.5c2 0 3.3 1.2 4 2.3.7-1.1 2-2.3 4-2.3 3.2 0 4.6 3.4 3.2 6.3C19.5 16.4 12 21 12 21z" />
      </svg>
      {fav ? 'En favoritos' : 'Guardar'}
    </button>
  );
}

'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { addFavorite, removeFavorite, listFavoriteIds } from '@/lib/client-api';

/** Corazón para guardar/quitar un producto de favoritos. Requiere sesión. */
export function FavoriteButton({ productId }: { productId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [fav, setFav] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) {
      setFav(false);
      return;
    }
    listFavoriteIds()
      .then((ids) => setFav(ids.includes(productId)))
      .catch(() => {});
  }, [user, productId]);

  async function toggle() {
    if (!user) {
      router.push(`/ingresar?next=${encodeURIComponent(pathname)}`);
      return;
    }
    setBusy(true);
    try {
      if (fav) {
        await removeFavorite(productId);
        setFav(false);
      } else {
        await addFavorite(productId);
        setFav(true);
      }
    } catch {
      /* noop */
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
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

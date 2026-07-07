'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFavorites } from '@/lib/favorites-context';

/**
 * Corazón compacto para la esquina de una tarjeta de producto. Usa el contexto
 * compartido de favoritos (una sola carga por sesión). Sin sesión, lleva a ingresar.
 */
export function FavoriteHeart({ productId, className = '' }: { productId: string; className?: string }) {
  const { isFavorite, toggle } = useFavorites();
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const fav = isFavorite(productId);

  async function onClick(e: React.MouseEvent) {
    // La tarjeta suele estar dentro de un enlace vecino; evita cualquier arrastre de foco.
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const hadSession = await toggle(productId);
    setBusy(false);
    if (!hadSession) router.push(`/ingresar?next=${encodeURIComponent(pathname)}`);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={fav}
      aria-label={fav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-paper/85 text-ink backdrop-blur-sm transition hover:bg-paper ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        width="15"
        height="15"
        fill={fav ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <path d="M12 21s-7.5-4.6-10-9.2C.6 8.9 2 5.5 5.2 5.5c2 0 3.3 1.2 4 2.3.7-1.1 2-2.3 4-2.3 3.2 0 4.6 3.4 3.2 6.3C19.5 16.4 12 21 12 21z" />
      </svg>
    </button>
  );
}

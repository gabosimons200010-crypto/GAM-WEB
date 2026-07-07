'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { listReviews, createReview, canReview as canReviewApi, ClientApiError } from '@/lib/client-api';
import type { Review } from '@/lib/types';

/** Reseñas del producto: promedio, listado y formulario (solo quien compró). */
export function ProductReviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [canReview, setCanReview] = useState<boolean | null>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function load() {
    listReviews(productId)
      .then(setReviews)
      .catch(() => setReviews([]));
  }
  useEffect(load, [productId]);

  // Solo puede reseñar quien compró el producto.
  useEffect(() => {
    if (!user) {
      setCanReview(null);
      return;
    }
    setCanReview(null);
    canReviewApi(productId)
      .then((r) => setCanReview(r.canReview))
      .catch(() => setCanReview(false));
  }, [user, productId]);

  const avg = reviews && reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;

  async function submit() {
    if (rating < 1) {
      setMsg('Elige de 1 a 5 estrellas.');
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await createReview(productId, rating, comment.trim() || undefined);
      setComment('');
      setRating(0);
      load();
      setMsg('¡Gracias por tu reseña!');
    } catch (e) {
      setMsg(e instanceof ClientApiError ? e.message : 'No se pudo enviar la reseña');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-14 border-t border-line pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
        <h2 className="font-display text-2xl text-ink">Reseñas</h2>
        {reviews && reviews.length > 0 && (
          <span className="flex items-center gap-2">
            <Stars value={Math.round(avg)} />
            <span className="microcaps text-muted">
              {avg.toFixed(1)} · {reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'}
            </span>
          </span>
        )}
      </div>

      {/* Formulario: solo con sesión y compra verificada */}
      {!user ? (
        <p className="microcaps mt-6 text-muted">
          <Link href={`/ingresar?next=${encodeURIComponent(pathname)}`} className="border-b border-ink pb-0.5 text-ink">
            Inicia sesión
          </Link>{' '}
          para dejar una reseña.
        </p>
      ) : canReview === null ? (
        <p className="microcaps mt-6 text-muted">Comprobando tu compra…</p>
      ) : canReview ? (
        <div className="mt-6">
          <p className="microcaps mb-2 text-muted">Deja tu reseña · compra verificada ✓</p>
          <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onMouseEnter={() => setHover(n)} onClick={() => setRating(n)} aria-label={`${n} estrellas`}>
                <Star filled={n <= (hover || rating)} size={22} />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            maxLength={600}
            placeholder="Cuéntanos qué te pareció (opcional)"
            className="mt-3 w-full border-b border-line bg-transparent pb-1.5 text-[14px] text-ink placeholder:text-line focus:border-ink focus:outline-none"
          />
          <div className="mt-3 flex items-center gap-4">
            <button
              onClick={submit}
              disabled={busy}
              className="microcaps bg-ink px-8 py-3 text-paper transition hover:opacity-80 disabled:opacity-50"
            >
              {busy ? 'Enviando…' : 'Publicar reseña'}
            </button>
            {msg && <span className="microcaps text-muted">{msg}</span>}
          </div>
        </div>
      ) : (
        <p className="microcaps mt-6 text-muted">
          Solo quienes compraron este producto pueden reseñarlo.
        </p>
      )}

      {/* Listado */}
      <div className="mt-8">
        {reviews === null ? (
          <p className="microcaps text-muted">Cargando…</p>
        ) : reviews.length === 0 ? (
          <p className="microcaps text-muted">Aún no hay reseñas. ¡Sé el primero!</p>
        ) : (
          <ul className="divide-y divide-line border-t border-line">
            {reviews.map((r) => (
              <li key={r.id} className="py-4">
                <div className="flex items-center justify-between">
                  <span className="microcaps text-ink">{r.authorName}</span>
                  <Stars value={r.rating} />
                </div>
                {r.comment && <p className="mt-1.5 text-[14px] leading-relaxed text-ink">{r.comment}</p>}
                <p className="microcaps mt-1 text-[10px] text-muted">
                  {new Date(r.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} filled={n <= value} size={14} />
      ))}
    </span>
  );
}

function Star({ filled, size = 16 }: { filled: boolean; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={filled ? '#111111' : 'none'} stroke="#111111" strokeWidth="1.4">
      <path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6L12 16.9 6.7 19.6l1.1-6L3.4 9.4l6-.8L12 3z" />
    </svg>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { listFavorites, ClientApiError } from '@/lib/client-api';
import { ProductGrid } from '@/components/ProductGrid';
import type { FavoriteProduct, ProductCard } from '@/lib/types';

export default function FavoritesPage() {
  const { user, ready } = useAuth();
  const [items, setItems] = useState<FavoriteProduct[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      setItems([]);
      return;
    }
    listFavorites()
      .then(setItems)
      .catch((e) => setError(e instanceof ClientApiError ? e.message : 'No pudimos cargar tus favoritos'));
  }, [ready, user]);

  if (ready && !user) {
    return (
      <Panel>
        <h1 className="font-display text-3xl text-ink">Inicia sesión para ver tus favoritos</h1>
        <Link href="/ingresar?next=/favoritos" className="microcaps mt-8 inline-block bg-ink px-10 py-3.5 text-paper hover:opacity-80">
          Ingresar
        </Link>
      </Panel>
    );
  }

  if (error) return <Panel><p className="microcaps text-sale">{error}</p></Panel>;
  if (items === null) return <Panel><p className="microcaps text-muted">Cargando…</p></Panel>;

  if (items.length === 0) {
    return (
      <Panel>
        <h1 className="font-display text-3xl text-ink">Aún no tienes favoritos</h1>
        <p className="microcaps mt-2 text-muted">Guarda prendas con el corazón para verlas aquí.</p>
        <Link href="/buscar" className="microcaps mt-8 inline-block bg-ink px-10 py-3.5 text-paper hover:opacity-80">
          Ver catálogo
        </Link>
      </Panel>
    );
  }

  // Adapta FavoriteProduct a la forma de tarjeta de la grilla.
  const cards: ProductCard[] = items.map((f) => ({
    id: f.id,
    slug: f.slug,
    name: f.name,
    price: f.price,
    salePrice: f.salePrice,
    thumbnailUrl: f.thumbnailUrl,
    gender: null,
    storeId: '',
    storeName: f.storeName,
    storeSlug: f.storeSlug,
    ratingAvg: 0,
    ratingCount: 0,
    soldCount: 0,
    createdAt: '',
  }));

  return (
    <div className="space-y-6">
      <h1 className="border-b border-line pb-3 font-display text-3xl text-ink sm:text-5xl">Favoritos</h1>
      <ProductGrid products={cards} />
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-lg py-20 text-center">{children}</div>;
}

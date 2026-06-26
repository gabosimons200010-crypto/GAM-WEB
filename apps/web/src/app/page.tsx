import Link from 'next/link';
import { searchProducts } from '@/lib/api';
import { ProductGrid } from '@/components/ProductGrid';
import type { SearchResult } from '@/lib/types';

// La home muestra novedades y lo más vendido. Es dinámica (depende de la API).
export const dynamic = 'force-dynamic';

async function safeSearch(params: Parameters<typeof searchProducts>[0]): Promise<SearchResult | null> {
  try {
    return await searchProducts(params);
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const [newest, bestSelling] = await Promise.all([
    safeSearch({ sort: 'newest', pageSize: 10 }),
    safeSearch({ sort: 'best_selling', pageSize: 10 }),
  ]);

  const apiDown = newest === null && bestSelling === null;

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-brand-500 to-brand-700 px-6 py-12 text-white sm:px-12">
        <h1 className="max-w-2xl text-3xl font-black leading-tight sm:text-4xl">
          El emporio de Gamarra, ahora a un clic.
        </h1>
        <p className="mt-3 max-w-xl text-brand-50">
          Miles de prendas de las mejores tiendas de Gamarra. Encuentra, compara y compra sin moverte de casa.
        </p>
        <Link
          href="/buscar"
          className="mt-6 inline-block rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-brand-700 hover:bg-brand-50"
        >
          Explorar catálogo
        </Link>
      </section>

      {apiDown && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          No pudimos conectar con la API. Verifica que el backend esté corriendo en{' '}
          <code className="font-mono">localhost:4000</code> (<code>pnpm --filter @gamarra/api dev</code>).
        </div>
      )}

      {newest && newest.items.length > 0 && (
        <Section title="Novedades" href="/buscar?sort=newest" result={newest} />
      )}
      {bestSelling && bestSelling.items.length > 0 && (
        <Section title="Lo más vendido" href="/buscar?sort=best_selling" result={bestSelling} />
      )}

      {!apiDown && (newest?.items.length ?? 0) === 0 && (bestSelling?.items.length ?? 0) === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          <p className="text-2xl">🛍️</p>
          <p className="mt-2 font-medium">Aún no hay productos publicados</p>
          <p className="mt-1 text-sm">
            Crea una tienda, publica productos y aparecerán aquí. (Por ahora la vitrina está vacía.)
          </p>
        </div>
      )}
    </div>
  );
}

function Section({ title, href, result }: { title: string; href: string; result: SearchResult }) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        <Link href={href} className="text-sm font-medium text-brand-600 hover:underline">
          Ver más →
        </Link>
      </div>
      <ProductGrid products={result.items} />
    </section>
  );
}

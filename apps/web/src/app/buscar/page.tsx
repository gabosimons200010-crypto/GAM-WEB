import { Suspense } from 'react';
import { searchProducts } from '@/lib/api';
import { ProductGrid } from '@/components/ProductGrid';
import { Filters } from '@/components/Filters';
import { Pagination } from '@/components/Pagination';
import type { Gender, SearchResult, SortOption } from '@/lib/types';

export const dynamic = 'force-dynamic';

type RawParams = Record<string, string | string[] | undefined>;

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function num(v: string | string[] | undefined): number | undefined {
  const s = str(v);
  if (s === undefined || s === '') return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const sp = await searchParams;
  const q = str(sp.q);
  const params = {
    q,
    category: str(sp.category),
    gender: str(sp.gender) as Gender | undefined,
    minPrice: num(sp.minPrice),
    maxPrice: num(sp.maxPrice),
    sort: (str(sp.sort) as SortOption | undefined) ?? 'relevance',
    page: num(sp.page) ?? 1,
    pageSize: 20,
  };

  let result: SearchResult | null = null;
  let error = false;
  try {
    result = await searchProducts(params);
  } catch {
    error = true;
  }

  const queryForLinks = {
    q,
    category: params.category,
    gender: params.gender,
    minPrice: params.minPrice?.toString(),
    maxPrice: params.maxPrice?.toString(),
    sort: params.sort,
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
      <Suspense fallback={<div className="h-64 rounded-xl bg-white" />}>
        <Filters />
      </Suspense>

      <div>
        <div className="mb-4">
          <h1 className="text-xl font-bold">{q ? `Resultados para “${q}”` : 'Catálogo'}</h1>
          {result && (
            <p className="text-sm text-gray-500">
              {result.total} {result.total === 1 ? 'producto' : 'productos'}
            </p>
          )}
        </div>

        {error ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            No pudimos cargar el catálogo. ¿Está corriendo el backend en <code>localhost:4000</code>?
          </div>
        ) : (
          result && (
            <>
              <ProductGrid products={result.items} />
              <Pagination basePath="/buscar" query={queryForLinks} page={result.page} hasMore={result.hasMore} />
            </>
          )
        )}
      </div>
    </div>
  );
}

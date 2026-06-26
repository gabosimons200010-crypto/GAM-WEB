import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getStorePage } from '@/lib/api';
import { ProductGrid } from '@/components/ProductGrid';
import { Pagination } from '@/components/Pagination';
import type { SortOption } from '@/lib/types';

export const dynamic = 'force-dynamic';

type RawParams = Record<string, string | string[] | undefined>;
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getStorePage(slug).catch(() => null);
  return { title: page ? `${page.store.name} — GAMARRA GO` : 'Tienda — GAMARRA GO' };
}

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawParams>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const page = Number(str(sp.page)) || 1;
  const sort = (str(sp.sort) as SortOption | undefined) ?? 'newest';

  const data = await getStorePage(slug, { sort, page, pageSize: 20 });
  if (!data) notFound();

  const { store, products } = data;

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="h-32 bg-gradient-to-r from-brand-400 to-brand-600 sm:h-40">
          {store.bannerUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.bannerUrl} alt={store.name} className="h-full w-full object-cover" />
          )}
        </div>
        <div className="flex items-end gap-4 px-6 pb-5">
          <div className="-mt-10 h-20 w-20 shrink-0 overflow-hidden rounded-xl border-4 border-white bg-gray-100">
            {store.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={store.logoUrl} alt={store.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl text-gray-300">🏬</div>
            )}
          </div>
          <div className="pt-3">
            <h1 className="flex items-center gap-2 text-xl font-bold">
              {store.name}
              {store.verified && <span className="text-sm text-brand-600" title="Tienda verificada">✔️</span>}
            </h1>
            <p className="text-sm text-gray-500">
              {[store.floor && `Piso ${store.floor}`, store.stand && `Stand ${store.stand}`].filter(Boolean).join(' · ') ||
                'Gamarra, Lima'}
              {store.salesCount > 0 && ` · ${store.salesCount} ventas`}
            </p>
          </div>
        </div>
        {store.description && <p className="border-t border-gray-100 px-6 py-3 text-sm text-gray-600">{store.description}</p>}
      </div>

      <h2 className="mb-4 mt-8 text-lg font-bold">Productos de la tienda</h2>
      <ProductGrid products={products.items} />
      <Pagination basePath={`/tienda/${slug}`} query={{ sort }} page={products.page} hasMore={products.hasMore} />
    </div>
  );
}

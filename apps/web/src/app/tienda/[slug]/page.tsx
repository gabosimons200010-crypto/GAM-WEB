import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getStorePage } from '@/lib/api';
import { ProductGrid } from '@/components/ProductGrid';
import { Pagination } from '@/components/Pagination';
import { getBrandBySlug, brandSocials } from '@/lib/brands';
import type { SortOption } from '@/lib/types';

export const dynamic = 'force-dynamic';

type RawParams = Record<string, string | string[] | undefined>;
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getStorePage(slug).catch(() => null);
  return { title: page ? `${page.store.name} — Emporio` : 'Tienda — Emporio' };
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
  const brand = getBrandBySlug(slug);
  const socials = brand ? brandSocials(brand) : [];

  return (
    <div>
      {/* ── Perfil de marca editorial ── */}
      <div className="border-b border-line pb-10 pt-6 text-center">
        <h1 className="font-display text-5xl text-ink sm:text-6xl">{store.name}</h1>
        <p className="microcaps mt-4 text-muted">
          {store.salesCount > 0 && `${store.salesCount} ventas`}
          {store.rating > 0 && `${store.salesCount > 0 ? ' · ' : ''}★ ${Number(store.rating).toFixed(1)}`}
          {store.verified && `${store.salesCount > 0 || store.rating > 0 ? ' · ' : ''}Tienda verificada`}
        </p>
        {store.description && (
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-ink">{store.description}</p>
        )}

        {/* Redes de la marca (clickeables) */}
        {socials.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2">
            {socials.map((s) => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="microcaps border-b border-ink pb-0.5 text-ink transition hover:opacity-60"
              >
                {s.label}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="mb-7 mt-10 flex items-baseline justify-between border-b border-line pb-3">
        <h2 className="font-display text-2xl text-ink">Piezas de la tienda</h2>
        <span className="microcaps text-muted">{products.total} en vitrina</span>
      </div>
      <ProductGrid products={products.items} />
      <Pagination basePath={`/tienda/${slug}`} query={{ sort }} page={products.page} hasMore={products.hasMore} />
    </div>
  );
}

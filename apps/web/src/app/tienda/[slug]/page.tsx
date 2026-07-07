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
  // Prioriza lo que el vendedor subió/editó; cae a los datos curados de brands.ts.
  const nice: Record<string, string> = { instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook', web: 'Web' };
  const socials =
    store.socials?.length > 0
      ? store.socials.map((s) => ({ label: nice[s.platform] ?? s.platform, href: s.url }))
      : brand
        ? brandSocials(brand)
        : [];
  const editorial = store.bannerUrl ?? brand?.editorialUrl ?? null;
  const logo = store.logoUrl ?? brand?.logoUrl ?? null;

  return (
    <div>
      {/* ── Cabecera de marca: editorial + logo (o placeholder) ── */}
      <div className="relative -mt-6 h-[42vh] min-h-72 overflow-hidden bg-[#f4f4f4]">
        {editorial && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={editorial} alt={store.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
          </>
        )}
        {/* Sin editorial: banda gris con marca de agua sutil (placeholder). */}
        {!editorial && (
          <span className="pointer-events-none absolute right-4 top-2 font-display text-[22vw] leading-none text-[#ededed]">
            {store.name
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 3)}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-5 sm:p-8">
          <div className="flex items-end gap-4">
            {logo && (
              <span className="bg-paper/90 px-3 py-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo} alt={store.name} className="max-h-10 max-w-40 object-contain" />
              </span>
            )}
            <h1 className={`font-display text-4xl leading-none sm:text-6xl ${editorial ? 'text-paper' : 'text-ink'}`}>
              {store.name}
            </h1>
          </div>
          {store.verified && (
            <span className="microcaps bg-paper/90 px-2.5 py-1 text-ink">Tienda verificada</span>
          )}
        </div>
      </div>

      {/* Meta + redes + descripción */}
      <div className="border-b border-line py-6 text-center">
        <p className="microcaps text-muted">
          {store.salesCount > 0 && `${store.salesCount} ventas`}
          {store.rating > 0 && `${store.salesCount > 0 ? ' · ' : ''}★ ${Number(store.rating).toFixed(1)}`}
          {store.salesCount === 0 && store.rating === 0 && 'Marca en Emporio'}
        </p>
        {store.description && (
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-ink">{store.description}</p>
        )}
        {socials.length > 0 && (
          <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2">
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

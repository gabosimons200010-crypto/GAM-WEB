import Link from 'next/link';
import { searchProducts } from '@/lib/api';
import { ProductGrid } from '@/components/ProductGrid';
import { BRANDS } from '@/lib/brands';
import { CAPSULE } from '@/lib/drop';
import type { SearchResult } from '@/lib/types';

// La home muestra el hero editorial, un adelanto de marcas y el catálogo. Es dinámica (depende de la API).
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
  const featuredBrands = BRANDS.slice(0, 3);

  return (
    <div className="space-y-16">
      {/* ══════════ HERO EDITORIAL ══════════ */}
      <section className="full-bleed relative -mt-6 h-[86vh] overflow-hidden bg-ink">
        <img
          src={CAPSULE.heroImage}
          alt="Editorial de la nueva cápsula"
          className="h-full w-full object-cover object-[center_18%]"
        />
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 pb-12 text-center text-paper">
          <p className="microcaps drop-shadow">{CAPSULE.heroLabel}</p>
          <Link href="/buscar" className="microcaps border-b border-paper pb-0.5 drop-shadow transition hover:opacity-70">
            Ver colección
          </Link>
        </div>
      </section>

      {apiDown && (
        <div className="border border-line p-4 text-sm text-muted">
          No pudimos conectar con la API. Verifica que el backend esté corriendo en{' '}
          <code>localhost:4000</code> (<code>pnpm --filter @gamarra/api dev</code>).
        </div>
      )}

      {newest && newest.items.length > 0 && <Section title="Novedades" href="/buscar?sort=newest" result={newest} />}

      {/* ══════════ ADELANTO DE MARCAS ══════════ */}
      <section>
        <div className="mb-7 flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
          <h2 className="font-display text-3xl text-ink">Las marcas</h2>
          <Link href="/marcas" className="microcaps border-b border-ink pb-0.5 text-ink hover:opacity-70">
            Ver todas las marcas
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-x-3 gap-y-8 sm:grid-cols-3">
          {featuredBrands.map((b) => (
            <Link key={b.slug} href={`/tienda/${b.slug}`} className="group flex flex-col">
              <div className="relative aspect-[4/5] overflow-hidden bg-[#f4f4f4]">
                {b.editorialUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.editorialUrl}
                    alt={b.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="font-display text-4xl text-line">{b.name}</span>
                  </div>
                )}
              </div>
              <div className="flex items-baseline justify-between pt-3">
                <span className="font-display text-xl text-ink group-hover:italic">{b.name}</span>
                <span className="microcaps text-muted">Ver catálogo</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {bestSelling && bestSelling.items.length > 0 && (
        <Section title="Lo más vendido" href="/buscar?sort=best_selling" result={bestSelling} />
      )}

      {!apiDown && (newest?.items.length ?? 0) === 0 && (bestSelling?.items.length ?? 0) === 0 && (
        <div className="border border-dashed border-line p-12 text-center">
          <p className="font-display text-2xl text-ink">La vitrina está vacía</p>
          <p className="microcaps mt-3 text-muted">Crea una tienda, publica productos y aparecerán aquí.</p>
        </div>
      )}
    </div>
  );
}

function Section({ title, href, result }: { title: string; href: string; result: SearchResult }) {
  return (
    <section>
      <div className="mb-7 flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
        <h2 className="font-display text-3xl text-ink">{title}</h2>
        <Link href={href} className="microcaps border-b border-ink pb-0.5 text-ink hover:opacity-70">
          Ver más
        </Link>
      </div>
      <ProductGrid products={result.items} />
    </section>
  );
}

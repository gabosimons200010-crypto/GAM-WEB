import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProduct, getStorePage, searchProducts } from '@/lib/api';
import { productExtras, sizeChartFor } from '@/lib/product-extras';
import { Price } from '@/components/Price';
import { Gallery } from '@/components/Gallery';
import { ProductPurchase } from '@/components/ProductPurchase';
import { FavoriteButton } from '@/components/FavoriteButton';
import { ProductReviews } from '@/components/ProductReviews';
import { ProductGrid } from '@/components/ProductGrid';
import { genderLabel } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug).catch(() => null);
  if (!product) return { title: 'Producto — Emporio' };
  const description =
    product.description?.replace(/\s+/g, ' ').trim().slice(0, 160) ||
    `${product.name} de ${product.storeName} en Emporio. Moda peruana online, envíos a todo el Perú.`;
  const image = product.media?.[0]?.url;
  return {
    title: `${product.name} — ${product.storeName} | Emporio`,
    description,
    openGraph: {
      title: product.name,
      description,
      type: 'website',
      images: image ? [{ url: image }] : [],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  // Relacionados: otras piezas de la misma tienda.
  const related = await getStorePage(product.storeSlug, { pageSize: 6 })
    .then((d) => (d?.products.items ?? []).filter((p) => p.slug !== product.slug).slice(0, 4))
    .catch(() => []);

  // "Completa el look": piezas de otras marcas que combinan.
  const completeLook = await searchProducts({ sort: 'best_selling', pageSize: 12 })
    .then((r) => r.items.filter((p) => p.storeSlug !== product.storeSlug).slice(0, 4))
    .catch(() => []);

  const extras = productExtras(product);
  const sizeChart = sizeChartFor(product);

  return (
    <div>
      <nav className="microcaps mb-8 text-muted">
        <Link href="/" className="hover:text-ink">
          Inicio
        </Link>{' '}
        / <Link href="/buscar" className="hover:text-ink">Catálogo</Link> /{' '}
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <Gallery media={product.media} name={product.name} slug={product.slug} />

        <div className="space-y-7 md:pt-4">
          <div className="border-b border-line pb-6">
            <Link
              href={`/tienda/${product.storeSlug}`}
              className="microcaps text-muted transition hover:text-ink hover:underline hover:underline-offset-4"
            >
              {product.storeName}
            </Link>
            <h1 className="mt-1 font-display text-3xl text-ink sm:text-4xl">{product.name}</h1>
            <div className="microcaps mt-3 flex flex-wrap items-center gap-3 text-muted">
              <span>Ref. {product.sku}</span>
              {product.gender && <span>· {genderLabel(product.gender)}</span>}
              {product.soldCount > 0 && <span>· {product.soldCount} vendidos</span>}
              {product.ratingCount > 0 && (
                <span>
                  · ★ {product.ratingAvg.toFixed(1)} ({product.ratingCount})
                </span>
              )}
            </div>
            <div className="mt-4">
              <Price price={product.price} salePrice={product.salePrice} size="lg" />
            </div>
          </div>

          <ProductPurchase product={product} />

          <FavoriteButton productId={product.id} />

          {product.description && (
            <div className="border-t border-line pt-6">
              <h2 className="microcaps mb-3 text-muted">Descripción</h2>
              <p className="max-w-prose whitespace-pre-line text-sm leading-relaxed text-ink">{product.description}</p>
            </div>
          )}

          <details className="border-t border-line pt-6">
            <summary className="microcaps cursor-pointer list-none text-ink">Composición y cuidados</summary>
            <div className="mt-3 space-y-1 text-sm text-ink">
              <p>{extras.composition}</p>
              <ul className="mt-2 space-y-1 text-muted">
                {extras.care.map((c) => (
                  <li key={c}>· {c}</li>
                ))}
              </ul>
            </div>
          </details>

          <details className="border-t border-line pt-6">
            <summary className="microcaps cursor-pointer list-none text-ink">Guía de tallas · {product.storeName}</summary>
            <table className="mt-3 w-full text-sm text-ink">
              <thead>
                <tr className="microcaps border-b border-ink text-left text-[10px] text-muted">
                  <th className="py-2 font-normal">Talla</th>
                  <th className="py-2 font-normal">Pecho (cm)</th>
                  <th className="py-2 font-normal">Largo (cm)</th>
                </tr>
              </thead>
              <tbody>
                {sizeChart.map((r) => (
                  <tr key={r.size} className="border-b border-line">
                    <td className="py-2">{r.size}</td>
                    <td className="py-2">{r.chest}</td>
                    <td className="py-2">{r.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-muted">Medidas de referencia de la prenda. Cada marca define su propio tallaje.</p>
          </details>

          {product.tags.length > 0 && (
            <div className="microcaps flex flex-wrap gap-x-5 gap-y-2 text-muted">
              {product.tags.map((t) => (
                <Link key={t} href={`/buscar?q=${encodeURIComponent(t)}`} className="hover:text-ink hover:underline hover:underline-offset-4">
                  #{t}
                </Link>
              ))}
            </div>
          )}

          {/* Botón a la tienda de la marca */}
          <Link
            href={`/tienda/${product.storeSlug}`}
            className="microcaps flex items-center justify-between border border-line px-5 py-4 transition hover:border-ink"
          >
            <span className="text-ink">Ver más de {product.storeName}</span>
            <span className="text-muted">→</span>
          </Link>
        </div>
      </div>

      <ProductReviews productId={product.id} />

      {related.length > 0 && (
        <section className="mt-14 border-t border-line pt-8">
          <div className="mb-6 flex items-baseline justify-between border-b border-line pb-3">
            <h2 className="font-display text-2xl text-ink">Más de {product.storeName}</h2>
            <Link href={`/tienda/${product.storeSlug}`} className="microcaps text-muted hover:text-ink">
              Ver tienda →
            </Link>
          </div>
          <ProductGrid products={related} />
        </section>
      )}

      {completeLook.length > 0 && (
        <section className="mt-14 border-t border-line pt-8">
          <div className="mb-6 flex items-baseline justify-between border-b border-line pb-3">
            <h2 className="font-display text-2xl text-ink">Completa el look</h2>
            <span className="microcaps text-muted">Otras marcas que combinan</span>
          </div>
          <ProductGrid products={completeLook} />
        </section>
      )}
    </div>
  );
}

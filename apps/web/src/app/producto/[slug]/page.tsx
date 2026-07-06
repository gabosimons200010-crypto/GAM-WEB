import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProduct } from '@/lib/api';
import { Price } from '@/components/Price';
import { Gallery } from '@/components/Gallery';
import { ProductPurchase } from '@/components/ProductPurchase';
import { genderLabel } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug).catch(() => null);
  return { title: product ? `${product.name} — Emporio` : 'Producto — Emporio' };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

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
            <h1 className="font-display text-3xl text-ink sm:text-4xl">{product.name}</h1>
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

          {product.description && (
            <div className="border-t border-line pt-6">
              <h2 className="microcaps mb-3 text-muted">Descripción</h2>
              <p className="max-w-prose whitespace-pre-line text-sm leading-relaxed text-ink">{product.description}</p>
            </div>
          )}

          {product.tags.length > 0 && (
            <div className="microcaps flex flex-wrap gap-x-5 gap-y-2 text-muted">
              {product.tags.map((t) => (
                <Link key={t} href={`/buscar?q=${encodeURIComponent(t)}`} className="hover:text-ink hover:underline hover:underline-offset-4">
                  #{t}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

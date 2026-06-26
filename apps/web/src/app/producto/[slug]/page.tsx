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
  return { title: product ? `${product.name} — GAMARRA GO` : 'Producto — GAMARRA GO' };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  return (
    <div>
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/" className="hover:text-brand-600">
          Inicio
        </Link>{' '}
        / <Link href="/buscar" className="hover:text-brand-600">Catálogo</Link> /{' '}
        <span className="text-gray-700">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Gallery media={product.media} name={product.name} />

        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
              {product.gender && <span>{genderLabel(product.gender)}</span>}
              {product.soldCount > 0 && <span>· {product.soldCount} vendidos</span>}
              {product.ratingCount > 0 && (
                <span>· ⭐ {product.ratingAvg.toFixed(1)} ({product.ratingCount})</span>
              )}
            </div>
          </div>

          <Price price={product.price} salePrice={product.salePrice} size="lg" />

          <ProductPurchase variants={product.variants} />

          {product.description && (
            <div className="border-t border-gray-200 pt-4">
              <h2 className="mb-1 text-sm font-semibold text-gray-700">Descripción</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">{product.description}</p>
            </div>
          )}

          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((t) => (
                <Link
                  key={t}
                  href={`/buscar?q=${encodeURIComponent(t)}`}
                  className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 hover:bg-brand-50 hover:text-brand-700"
                >
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

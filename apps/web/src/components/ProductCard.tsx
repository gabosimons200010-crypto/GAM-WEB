import Link from 'next/link';
import type { ProductCard as ProductCardType } from '@/lib/types';
import { Price } from './Price';

/** Tarjeta de producto para la grilla del catálogo. */
export function ProductCard({ product }: { product: ProductCardType }) {
  return (
    <Link
      href={`/producto/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:border-brand-300 hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {product.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.thumbnailUrl}
            alt={product.name}
            className="h-full w-full object-cover transition group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl text-gray-300">👕</div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-medium text-gray-800 group-hover:text-brand-700">{product.name}</p>
        <p className="text-xs text-gray-400">{product.storeName}</p>
        <div className="mt-auto pt-1">
          <Price price={product.price} salePrice={product.salePrice} />
          {product.soldCount > 0 && <p className="mt-0.5 text-xs text-gray-400">{product.soldCount} vendidos</p>}
        </div>
      </div>
    </Link>
  );
}

import type { ProductCard as ProductCardType } from '@/lib/types';
import { ProductCard } from './ProductCard';

export function ProductGrid({ products }: { products: ProductCardType[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
        <p className="text-2xl">🧐</p>
        <p className="mt-2 font-medium">No encontramos productos</p>
        <p className="mt-1 text-sm">Prueba con otra búsqueda o quita algunos filtros.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

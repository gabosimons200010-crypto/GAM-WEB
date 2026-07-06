import type { ProductCard as ProductCardType } from '@/lib/types';
import { ProductCard } from './ProductCard';

export function ProductGrid({ products }: { products: ProductCardType[] }) {
  if (products.length === 0) {
    return (
      <div className="border border-dashed border-line p-12 text-center">
        <p className="font-display text-2xl text-ink">Sin resultados</p>
        <p className="microcaps mt-3 text-muted">Prueba con otra búsqueda o quita algunos filtros.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

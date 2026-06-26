import { discountPct, money } from '@/lib/format';

/** Muestra el precio con su oferta tachada y el % de descuento si aplica. */
export function Price({ price, salePrice, size = 'md' }: { price: number; salePrice: number | null; size?: 'md' | 'lg' }) {
  const pct = discountPct(price, salePrice);
  const effective = pct !== null ? salePrice! : price;
  const main = size === 'lg' ? 'text-2xl' : 'text-base';

  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className={`${main} font-bold text-gray-900`}>{money(effective)}</span>
      {pct !== null && (
        <>
          <span className="text-sm text-gray-400 line-through">{money(price)}</span>
          <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-semibold text-green-700">-{pct}%</span>
        </>
      )}
    </div>
  );
}

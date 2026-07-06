import { discountPct, money } from '@/lib/format';

/** Muestra el precio con su oferta tachada y el % de descuento si aplica. */
export function Price({ price, salePrice, size = 'md' }: { price: number; salePrice: number | null; size?: 'md' | 'lg' }) {
  const pct = discountPct(price, salePrice);
  const effective = pct !== null ? salePrice! : price;
  const main = size === 'lg' ? 'text-lg' : 'text-[13px]';

  return (
    <div className="flex flex-wrap items-baseline gap-2">
      {pct !== null && <span className="text-[12px] text-muted line-through">{money(price)}</span>}
      <span className={`${main} ${pct !== null ? 'text-sale' : 'text-ink'}`}>{money(effective)}</span>
      {pct !== null && <span className="text-[12px] text-sale">-{pct}%</span>}
    </div>
  );
}

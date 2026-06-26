const PEN = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
});

/** Formatea un monto en soles peruanos: 49.9 → "S/ 49.90". */
export function money(amount: number): string {
  return PEN.format(amount);
}

const GENDER_LABEL: Record<string, string> = {
  HOMBRE: 'Hombre',
  MUJER: 'Mujer',
  NINO: 'Niño',
  NINA: 'Niña',
  UNISEX: 'Unisex',
};

export function genderLabel(gender: string | null): string {
  return gender ? (GENDER_LABEL[gender] ?? gender) : '';
}

/** Descuento porcentual entre precio y precio de oferta (o null si no hay). */
export function discountPct(price: number, salePrice: number | null): number | null {
  if (salePrice === null || salePrice >= price || price <= 0) return null;
  return Math.round((1 - salePrice / price) * 100);
}

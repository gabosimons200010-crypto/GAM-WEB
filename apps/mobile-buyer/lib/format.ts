// Formateo local (sin depender de Intl, que es inconsistente en Hermes/RN).

/** Formatea un monto en soles peruanos: 49.9 → "S/ 49.90". */
export function money(amount: number): string {
  const fixed = Math.abs(amount).toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sign = amount < 0 ? '-' : '';
  return `${sign}S/ ${withThousands}.${decPart}`;
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

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Pendiente de pago',
  PAID: 'Pagado',
  PREPARING: 'En preparación',
  READY_FOR_PICKUP: 'Listo para recojo',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  RETURNED: 'Devuelto',
  DELIVERY_FAILED: 'Entrega fallida',
};

export function statusLabel(status: string): string {
  return STATUS_LABEL[status] ?? status;
}

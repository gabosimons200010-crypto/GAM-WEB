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

/** Clases de color para el badge de estado. */
export function statusColor(status: string): string {
  switch (status) {
    case 'PAID':
    case 'DELIVERED':
      return 'bg-green-100 text-green-700';
    case 'PENDING_PAYMENT':
      return 'bg-amber-100 text-amber-700';
    case 'CANCELLED':
    case 'DELIVERY_FAILED':
    case 'RETURNED':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-blue-100 text-blue-700';
  }
}

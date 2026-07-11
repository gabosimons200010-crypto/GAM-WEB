// Datos DEMO de ficha técnica: composición, cuidados y tallaje.
// Espejo de apps/mobile-buyer/lib/product-extras.ts — MANTENER SINCRONIZADOS.
// En producción estos datos los entrega cada marca (composición/cuidados por
// producto; guía de tallas por marca) vía backend, para que web y app muestren
// lo mismo. Aquí se derivan como marcador de posición hasta tener los reales.

import type { ProductDetail } from './types';

export interface ProductExtras {
  composition: string;
  care: string[];
}

function detect(text: string): 'denim' | 'hoodie' | 'abrigo' | 'punto' | 'default' {
  const t = text.toLowerCase();
  if (/(jean|denim|baggy|cargo)/.test(t)) return 'denim';
  if (/(hoodie|polera|buzo|sudadera|jogger|short)/.test(t)) return 'hoodie';
  if (/(casaca|abrigo|puffer|bomber|cazadora|sobrecamisa)/.test(t)) return 'abrigo';
  if (/(polo|camiseta|manga|boxy|básic|basic|tee)/.test(t)) return 'punto';
  return 'default';
}

const BY_TYPE: Record<string, ProductExtras> = {
  denim: {
    composition: '98% algodón · 2% elastano',
    care: ['Lavar del revés en frío', 'No usar lejía', 'Secar a la sombra', 'Planchar a temperatura media'],
  },
  hoodie: {
    composition: '80% algodón · 20% poliéster (french terry)',
    care: ['Lavar en frío con colores similares', 'No usar secadora', 'No planchar la estampa'],
  },
  abrigo: {
    composition: 'Exterior 100% poliéster · Forro 100% algodón',
    care: ['Limpieza en seco recomendada', 'No usar lejía', 'Planchar a baja temperatura'],
  },
  punto: {
    composition: '100% algodón peinado 24/1',
    care: ['Lavar en frío', 'No usar secadora', 'Planchar del revés a temperatura media'],
  },
  default: {
    composition: 'Algodón y mezclas — consultar con la marca',
    care: ['Lavar en frío', 'No usar lejía', 'Secar a la sombra'],
  },
};

/**
 * Composición y cuidados: usa los datos REALES del producto (que da la marca);
 * si aún no existen, cae a un valor demo derivado de la categoría.
 */
export function productExtras(product: ProductDetail): ProductExtras {
  const demo = BY_TYPE[detect(`${product.name} ${product.tags.join(' ')}`)];
  return {
    composition: product.composition ?? demo.composition,
    care: product.care && product.care.length > 0 ? product.care : demo.care,
  };
}

export interface SizeRow {
  size: string;
  chest: number;
  length: number;
}

const DEFAULT_SIZES: SizeRow[] = [
  { size: 'S', chest: 52, length: 68 },
  { size: 'M', chest: 55, length: 71 },
  { size: 'L', chest: 58, length: 74 },
  { size: 'XL', chest: 61, length: 77 },
];

const SIZES_BY_BRAND: Record<string, SizeRow[]> = {
  ntf: [
    { size: 'S', chest: 54, length: 69 },
    { size: 'M', chest: 57, length: 72 },
    { size: 'L', chest: 60, length: 75 },
    { size: 'XL', chest: 63, length: 78 },
  ],
  balboni: [
    { size: 'S', chest: 56, length: 70 },
    { size: 'M', chest: 59, length: 73 },
    { size: 'L', chest: 62, length: 76 },
  ],
  'vanta-studio': [
    { size: 'S', chest: 55, length: 70 },
    { size: 'M', chest: 58, length: 73 },
    { size: 'L', chest: 61, length: 76 },
    { size: 'XL', chest: 64, length: 79 },
  ],
};

/**
 * Guía de tallas: usa la REAL del producto/marca (API `sizeChart`); si no hay,
 * cae a una tabla demo por marca.
 */
export function sizeChartFor(product: ProductDetail): SizeRow[] {
  if (product.sizeChart && product.sizeChart.length > 0) return product.sizeChart;
  return SIZES_BY_BRAND[product.storeSlug] ?? DEFAULT_SIZES;
}

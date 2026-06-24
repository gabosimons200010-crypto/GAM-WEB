import { VisionInput, VisionResult } from '../application/ports/vision.port';

/**
 * Prompt de catalogación. Pide salida JSON estricta (IA-001 atributos + IA-002
 * copy). La taxonomía válida se inyecta para que el modelo no invente categorías.
 */
export function buildPrompt(input: VisionInput): string {
  const categories = input.categories.map((c) => `${c.id}=${c.name}`).join(', ') || '(ninguna)';
  return [
    'Eres un catalogador experto de prendas de vestir para un marketplace peruano (Gamarra).',
    'Analiza la imagen de la prenda y devuelve SOLO un objeto JSON válido, sin texto adicional, con esta forma exacta:',
    '{',
    '  "garmentType": string,            // tipo de prenda: polo, vestido, casaca, pantalón, etc.',
    '  "subcategory": string|null,',
    '  "gender": "HOMBRE"|"MUJER"|"NINO"|"NINA"|"UNISEX",',
    '  "material": string|null,          // material probable',
    '  "colors": string[],               // colores visibles, en español',
    '  "style": string|null,             // estilo (oversize, formal, casual, deportivo...)',
    '  "season": string|null,            // temporada (verano, invierno, etc.)',
    '  "cut": string|null,               // corte',
    '  "seoTags": string[],              // 5-10 etiquetas SEO',
    '  "categoryId": string|null,        // ELIGE un id EXACTO de la lista o null',
    '  "name": string,                   // nombre comercial atractivo (máx 60 chars), español',
    '  "description": string,            // descripción comercial vendedora (40-80 palabras)',
    '  "tags": string[],                 // palabras clave de búsqueda',
    '  "confidence": number              // 0..1 qué tan seguro estás del análisis',
    '}',
    `Categorías válidas (id=nombre): ${categories}`,
    'Responde en español peruano, orientado a venta. No incluyas markdown ni explicaciones.',
  ].join('\n');
}

interface RawVision {
  garmentType?: unknown;
  subcategory?: unknown;
  gender?: unknown;
  material?: unknown;
  colors?: unknown;
  style?: unknown;
  season?: unknown;
  cut?: unknown;
  seoTags?: unknown;
  categoryId?: unknown;
  name?: unknown;
  description?: unknown;
  tags?: unknown;
  confidence?: unknown;
}

const GENDERS = ['HOMBRE', 'MUJER', 'NINO', 'NINA', 'UNISEX'] as const;

/** Parsea y normaliza la respuesta del modelo a un VisionResult seguro. */
export function parseVision(
  text: string,
  input: VisionInput,
  provider: string,
  model: string,
  costUsd: number,
): VisionResult {
  const json = extractJson(text);
  const raw = JSON.parse(json) as RawVision;

  const asStr = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);
  const asArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

  const gender = GENDERS.includes(raw.gender as never) ? (raw.gender as VisionResult['attributes']['gender']) : 'UNISEX';
  const validCategory = input.categories.some((c) => c.id === raw.categoryId)
    ? (raw.categoryId as string)
    : null;
  const confidence =
    typeof raw.confidence === 'number' ? Math.max(0, Math.min(1, raw.confidence)) : 0.5;

  return {
    attributes: {
      garmentType: asStr(raw.garmentType) ?? 'prenda',
      subcategory: asStr(raw.subcategory),
      gender,
      material: asStr(raw.material),
      colors: asArr(raw.colors),
      style: asStr(raw.style),
      season: asStr(raw.season),
      cut: asStr(raw.cut),
      seoTags: asArr(raw.seoTags),
    },
    categoryId: validCategory,
    name: asStr(raw.name) ?? 'Producto sin nombre',
    description: asStr(raw.description) ?? '',
    tags: asArr(raw.tags),
    confidence,
    provider,
    model,
    costUsd,
  };
}

/** Aísla el objeto JSON aunque el modelo lo envuelva en ```json o texto. */
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('La respuesta de visión no contiene JSON');
  }
  return body.slice(start, end + 1);
}

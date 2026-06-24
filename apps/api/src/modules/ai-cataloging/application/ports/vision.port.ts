export type VisionGender = 'HOMBRE' | 'MUJER' | 'NINO' | 'NINA' | 'UNISEX';

/** Atributos extraídos de la prenda (IA-001). */
export interface VisionAttributes {
  garmentType: string;
  subcategory?: string | null;
  gender: VisionGender;
  material?: string | null;
  colors: string[];
  style?: string | null;
  season?: string | null;
  cut?: string | null;
  seoTags: string[];
}

/** Resultado completo del análisis: atributos (IA-001) + copy comercial (IA-002). */
export interface VisionResult {
  attributes: VisionAttributes;
  categoryId: string | null;
  name: string;
  description: string;
  tags: string[];
  confidence: number; // 0..1
  provider: string;
  model: string;
  costUsd: number;
}

export interface VisionInput {
  imageBytes: Buffer;
  contentType: string;
  categories: { id: string; name: string }[];
}

/** Proveedor concreto de visión (Gemini, OpenAI, Claude, stub). */
export abstract class VisionProvider {
  abstract analyze(input: VisionInput): Promise<VisionResult>;
}

/** Puerto de visión que consume el caso de uso (lo implementa el router). */
export abstract class VisionPort {
  abstract analyze(input: VisionInput): Promise<VisionResult>;
}

/** Tokens de inyección para los proveedores en cascada (ADR-05). */
export const VISION_BULK = Symbol('VISION_BULK');
export const VISION_ESCALATION = Symbol('VISION_ESCALATION');

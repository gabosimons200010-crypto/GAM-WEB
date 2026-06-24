import { VisionProvider, VisionInput, VisionResult } from '../application/ports/vision.port';

/**
 * Proveedor de visión de respaldo para desarrollo/CI sin GEMINI_API_KEY.
 * Devuelve atributos placeholder deterministas para que el pipeline completo
 * (lote → imagen → borrador) corra end-to-end sin llamar a la nube.
 */
export class StubVisionProvider extends VisionProvider {
  async analyze(input: VisionInput): Promise<VisionResult> {
    return {
      attributes: {
        garmentType: 'prenda',
        subcategory: null,
        gender: 'UNISEX',
        material: null,
        colors: ['negro'],
        style: null,
        season: null,
        cut: null,
        seoTags: ['ropa', 'gamarra'],
      },
      categoryId: input.categories[0]?.id ?? null,
      name: 'Producto (borrador IA)',
      description:
        'Borrador generado automáticamente. Completa nombre, precio y detalles antes de publicar.',
      tags: ['borrador'],
      confidence: 0.5,
      provider: 'stub',
      model: 'stub',
      costUsd: 0,
    };
  }
}

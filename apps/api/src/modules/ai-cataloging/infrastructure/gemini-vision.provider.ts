import { GoogleGenAI } from '@google/genai';
import { VisionProvider, VisionInput, VisionResult } from '../application/ports/vision.port';
import { buildPrompt, parseVision } from './vision-prompt';

/**
 * Proveedor de visión con Google Gemini (IA-001/002). Usa modo JSON
 * (responseMimeType) para salida estructurada. El modelo se inyecta para
 * soportar el enrutamiento por costo/confianza (ADR-05): flash-lite para el
 * grueso, pro para el escalado.
 */
export class GeminiVisionProvider extends VisionProvider {
  constructor(
    private readonly client: GoogleGenAI,
    private readonly model: string,
  ) {
    super();
  }

  async analyze(input: VisionInput): Promise<VisionResult> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: input.contentType, data: input.imageBytes.toString('base64') } },
            { text: buildPrompt(input) },
          ],
        },
      ],
      config: { responseMimeType: 'application/json', temperature: 0.2 },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Gemini no devolvió contenido');
    }
    // Free tier: costo 0; con facturación se calcularía desde usageMetadata.
    return parseVision(text, input, 'gemini', this.model, 0);
  }
}

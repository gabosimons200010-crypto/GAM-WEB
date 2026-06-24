import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  VisionPort,
  VisionProvider,
  VisionInput,
  VisionResult,
  VISION_BULK,
  VISION_ESCALATION,
} from '../application/ports/vision.port';

const CONFIDENCE_THRESHOLD = 0.6; // bajo esto, se escala al modelo superior (ADR-05)

/**
 * Enrutamiento por costo/confianza (ADR-05): cataloga con el modelo económico
 * (bulk) y solo escala al modelo superior si la confianza es baja. Tolera el
 * fallo del bulk reintentando con el de escalado.
 */
@Injectable()
export class VisionRouter extends VisionPort {
  private readonly logger = new Logger('VisionRouter');

  constructor(
    @Inject(VISION_BULK) private readonly bulk: VisionProvider,
    @Inject(VISION_ESCALATION) private readonly escalation: VisionProvider,
  ) {
    super();
  }

  async analyze(input: VisionInput): Promise<VisionResult> {
    let bulkResult: VisionResult | null = null;
    try {
      bulkResult = await this.bulk.analyze(input);
      if (bulkResult.confidence >= CONFIDENCE_THRESHOLD) {
        return bulkResult;
      }
      this.logger.debug(`Confianza ${bulkResult.confidence} < umbral; escalando al modelo superior`);
    } catch (e) {
      this.logger.warn(`Modelo bulk falló (${(e as Error).message}); intentando escalado`);
    }

    try {
      return await this.escalation.analyze(input);
    } catch (e) {
      if (bulkResult) {
        this.logger.warn('Escalado falló; se usa el resultado del bulk');
        return bulkResult; // degradación elegante
      }
      throw e;
    }
  }
}

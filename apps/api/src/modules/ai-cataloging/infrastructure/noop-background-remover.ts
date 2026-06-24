import { Injectable, Logger } from '@nestjs/common';
import { BackgroundRemover } from '../application/ports/image-processing';

/**
 * Remoción de fondo passthrough (MVP): devuelve la imagen sin cambios. Es el
 * punto de extensión para conectar un modelo especializado (Bria RMBG /
 * BiRefNet self-hosted en GPU, o remove.bg) — ADR-06. Mantener el LLM de visión
 * fuera de esta tarea.
 */
@Injectable()
export class NoopBackgroundRemover extends BackgroundRemover {
  private readonly logger = new Logger('BackgroundRemover');

  async remove(input: Buffer): Promise<Buffer> {
    this.logger.debug('Remoción de fondo passthrough (sin modelo especializado conectado)');
    return input;
  }
}

import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { ImageProcessor, OptimizedImage } from '../application/ports/image-processing';

const MAX_EDGE = 1600; // resolución máxima para catálogo

/**
 * Procesamiento de imagen con sharp. Convierte a WebP bajando la calidad hasta
 * cumplir el límite de tamaño (RNF-PERF-003). El hash perceptual (aHash 8x8) se
 * usará para deduplicación (IA-005, Sprint 6).
 */
@Injectable()
export class SharpImageProcessor extends ImageProcessor {
  async toWebp(input: Buffer, maxBytes: number): Promise<OptimizedImage> {
    const base = sharp(input).rotate().resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: 'inside',
      withoutEnlargement: true,
    });

    let quality = 82;
    let out = await base.clone().webp({ quality }).toBuffer({ resolveWithObject: true });
    while (out.data.byteLength > maxBytes && quality > 40) {
      quality -= 12;
      out = await base.clone().webp({ quality }).toBuffer({ resolveWithObject: true });
    }

    return {
      bytes: out.data,
      width: out.info.width,
      height: out.info.height,
      contentType: 'image/webp',
    };
  }

  async perceptualHash(input: Buffer): Promise<string> {
    // aHash: gris 8x8 → bits según el promedio. Robusto a recompresión/escala.
    const pixels = await sharp(input)
      .greyscale()
      .resize(8, 8, { fit: 'fill' })
      .raw()
      .toBuffer();
    const avg = pixels.reduce((s, p) => s + p, 0) / pixels.length;
    let bits = '';
    for (const p of pixels) bits += p >= avg ? '1' : '0';
    // Compacta los 64 bits a hex.
    return createHash('sha1').update(bits).digest('hex').slice(0, 16);
  }
}

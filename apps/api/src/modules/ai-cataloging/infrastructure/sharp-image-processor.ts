import { Injectable } from '@nestjs/common';
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
    // aHash: gris 8x8 → 64 bits según el promedio. Se empaqueta a 16 hex para
    // poder comparar por distancia de Hamming (IA-005, deduplicación).
    const pixels = await sharp(input)
      .greyscale()
      .resize(8, 8, { fit: 'fill' })
      .raw()
      .toBuffer();
    const avg = pixels.reduce((s, p) => s + p, 0) / pixels.length;
    let hex = '';
    for (let i = 0; i < 64; i += 4) {
      let nibble = 0;
      for (let b = 0; b < 4; b++) {
        nibble = (nibble << 1) | (pixels[i + b] >= avg ? 1 : 0);
      }
      hex += nibble.toString(16);
    }
    return hex; // 16 caracteres = 64 bits
  }
}

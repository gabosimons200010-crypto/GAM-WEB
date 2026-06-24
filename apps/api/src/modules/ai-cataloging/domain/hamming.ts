/**
 * Distancia de Hamming entre dos hashes perceptuales (hex de 16 chars = 64 bits).
 * Cuanto menor, más parecidas son las imágenes (IA-005).
 */
export function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) return Number.MAX_SAFE_INTEGER;
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    let xor = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (xor) {
      dist += xor & 1;
      xor >>= 1;
    }
  }
  return dist;
}

/** Umbral por defecto: ≤ 8 bits de 64 ⇒ se considera posible duplicado. */
export const DUPLICATE_THRESHOLD = 8;

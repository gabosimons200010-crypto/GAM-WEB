import { hammingDistance, DUPLICATE_THRESHOLD } from './hamming';

describe('hammingDistance', () => {
  it('es 0 para hashes idénticos', () => {
    expect(hammingDistance('ffff0000aaaa5555', 'ffff0000aaaa5555')).toBe(0);
  });

  it('cuenta los bits distintos', () => {
    // 0x0 (0000) vs 0xf (1111) = 4 bits; resto iguales.
    expect(hammingDistance('0000000000000000', 'f000000000000000')).toBe(4);
  });

  it('marca duplicado cuando la distancia es baja', () => {
    const a = '0000000000000000';
    const b = '0000000000000001'; // 1 bit distinto
    expect(hammingDistance(a, b)).toBeLessThanOrEqual(DUPLICATE_THRESHOLD);
  });

  it('no marca duplicado cuando difiere mucho', () => {
    expect(hammingDistance('0000000000000000', 'ffffffffffffffff')).toBe(64);
  });
});

import { describe, expect, it } from 'vitest';
import { pesosCortos } from './ejeCorto';

describe('pesosCortos', () => {
  it('los millones van con M, sin decimales si son redondos', () => {
    expect(pesosCortos(2_000_000_000)).toBe('$20 M');
    expect(pesosCortos(250_000_000)).toBe('$2,5 M');
  });
  it('los miles van con k', () => expect(pesosCortos(50_000_000)).toBe('$500 k'));
  it('lo menor a mil pesos va entero', () => expect(pesosCortos(45_000)).toBe('$450'));
  it('el cero y los negativos', () => {
    expect(pesosCortos(0)).toBe('$0');
    expect(pesosCortos(-500_000_000)).toBe('-$5 M');
  });
});

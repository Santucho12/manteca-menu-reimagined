import { describe, expect, it } from 'vitest';
import { cantidadDeResultados } from './lista';

describe('cantidadDeResultados', () => {
  it('usa el singular solo con uno', () => {
    expect(cantidadDeResultados(1)).toBe('1 Resultado');
    expect(cantidadDeResultados(0)).toBe('0 Resultados');
    expect(cantidadDeResultados(26)).toBe('26 Resultados');
  });
});

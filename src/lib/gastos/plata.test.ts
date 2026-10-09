import { describe, expect, it } from 'vitest';
import { centavosDeMonto, montoParaEditar } from './plata';

describe('centavosDeMonto', () => {
  it.each([
    ['1234', 123400],
    ['1234,5', 123450],
    ['1234,50', 123450],
    ['0,99', 99],
    ['1.234,50', 123450],
    ['1.234.567', 123456700],
    ['$ 12.345,50', 1234550],
    ['  80  ', 8000],
  ])('entiende "%s"', (texto, centavos) => {
    expect(centavosDeMonto(texto)).toBe(centavos);
  });

  it.each([
    '',
    '0',
    '0,00',
    '-100',
    '12,345',
    '1234.50',
    '1.23,00',
    '12.34',
    'abc',
    '1,2,3',
    '10000000000',
  ])('rechaza "%s"', (texto) => {
    expect(centavosDeMonto(texto)).toBeUndefined();
  });
});

describe('montoParaEditar', () => {
  it('lo deja como se escribe, y el lector lo vuelve a entender', () => {
    expect(montoParaEditar(1234550)).toBe('12.345,50');
    expect(montoParaEditar(8000)).toBe('80');
    expect(centavosDeMonto(montoParaEditar(123456789))).toBe(123456789);
  });
});

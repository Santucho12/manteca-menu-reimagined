import { describe, expect, it } from 'vitest';
import { formatearPesos, formatearPesosEnteros } from './plata';

describe('formatearPesos', () => {
  it('muestra cero con dos decimales', () => {
    expect(formatearPesos(0)).toBe('$0,00');
  });

  it('muestra centavos sueltos', () => {
    expect(formatearPesos(5)).toBe('$0,05');
  });

  it('separa los miles con punto y los decimales con coma', () => {
    expect(formatearPesos(123450)).toBe('$1.234,50');
  });

  it('separa los millones', () => {
    expect(formatearPesos(100000000)).toBe('$1.000.000,00');
  });

  it('pone el signo antes del peso en un monto negativo', () => {
    expect(formatearPesos(-123450)).toBe('-$1.234,50');
  });

  it('muestra centavos negativos sin perder el signo', () => {
    expect(formatearPesos(-5)).toBe('-$0,05');
  });

  it('rechaza un monto con decimales', () => {
    expect(() => formatearPesos(1.5)).toThrow('entero de centavos');
  });

  it('rechaza un monto que no es un numero', () => {
    expect(() => formatearPesos(Number.NaN)).toThrow('entero de centavos');
  });

  it('rechaza un monto tan grande que ya perdio precision', () => {
    expect(() => formatearPesos(2 ** 53)).toThrow('entero de centavos');
  });
});

describe('formatearPesosEnteros', () => {
  it.each([
    [400000, '$4.000'],
    [2000000, '$20.000'],
    [100, '$1'],
    [123456700, '$1.234.567'],
  ])('%i centavos se ven como %s', (centavos, texto) => {
    expect(formatearPesosEnteros(centavos)).toBe(texto);
  });

  it('rechaza un monto con centavos sueltos', () => {
    expect(() => formatearPesosEnteros(150)).toThrow();
  });
});

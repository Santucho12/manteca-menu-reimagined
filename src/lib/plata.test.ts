import { describe, expect, it } from 'vitest';
import { formatearPesos } from './plata';

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
});

import { describe, expect, it } from 'vitest';
import { compararFilas, textoDeVariacion, variacion } from './comparacion';

describe('variacion', () => {
  it('calcula la diferencia y el porcentaje con un decimal', () => {
    expect(variacion(150000, 120000)).toEqual({ diferenciaCentavos: 30000, porcentaje: 25 });
    expect(variacion(100000, 300000)).toEqual({
      diferenciaCentavos: -200000,
      porcentaje: -66.7,
    });
  });

  it('sin datos del otro periodo no compara', () => {
    expect(variacion(150000, null)).toBeNull();
  });

  it('contra cero da la diferencia sin porcentaje', () => {
    expect(variacion(150000, 0)).toEqual({ diferenciaCentavos: 150000, porcentaje: null });
  });

  it('lo muestra con signo, en pesos y en porcentaje', () => {
    expect(textoDeVariacion({ diferenciaCentavos: 30000, porcentaje: 25 })).toBe(
      '+$300,00 (+25 %)',
    );
    expect(textoDeVariacion({ diferenciaCentavos: -200000, porcentaje: -66.7 })).toBe(
      '-$2.000,00 (-66,7 %)',
    );
    expect(textoDeVariacion({ diferenciaCentavos: 0, porcentaje: 0 })).toBe('$0,00 (0 %)');
    expect(textoDeVariacion({ diferenciaCentavos: 5000, porcentaje: null })).toBe('+$50,00');
    expect(textoDeVariacion(null)).toBe('Sin datos para comparar');
  });
});

describe('compararFilas', () => {
  type Fila = { clave: string; monto: number };
  const fila = (clave: string, monto: number): Fila => ({ clave, monto });
  const comparar = (a: Fila[], b: Fila[] | null) =>
    compararFilas(
      a,
      b,
      (f) => f.clave,
      (f) => f.monto,
    ).map((c) => c.variacion);

  it('compara cada fila con la misma del otro periodo', () => {
    expect(comparar([fila('a', 200), fila('b', 50)], [fila('a', 100)])).toEqual([
      { diferenciaCentavos: 100, porcentaje: 100 },
      null,
    ]);
  });

  it('sin el otro periodo ninguna fila compara', () => {
    expect(comparar([fila('a', 200)], null)).toEqual([null]);
  });

  it('un periodo sin filas es lo mismo que no tener datos para comparar', () => {
    expect(comparar([fila('a', 200)], [])).toEqual([null]);
  });
});

import { describe, expect, it } from 'vitest';
import { agruparPorMes } from './porMes';

const item = (fecha: string, montoCentavos: number) => ({ fecha, montoCentavos });

describe('agruparPorMes', () => {
  it('junta lo que vence en cada mes, en orden, con lo que suma', () => {
    const grupos = agruparPorMes([
      item('2026-10-30', 5200000),
      item('2026-11-04', 390000000),
      item('2026-11-05', 118000000),
      item('2026-12-12', 8800000),
    ]);
    expect(grupos.map((g) => [g.mes, g.items.length, g.totalCentavos])).toEqual([
      ['2026-10', 1, 5200000],
      ['2026-11', 2, 508000000],
      ['2026-12', 1, 8800000],
    ]);
  });

  it('sin nada por pagar no hay meses', () => {
    expect(agruparPorMes([])).toEqual([]);
  });
});

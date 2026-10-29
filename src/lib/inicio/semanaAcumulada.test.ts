import { describe, expect, it } from 'vitest';
import type { DiaDeLaSemana } from './semana';
import { acumularSemana, resumenDeLaSemana } from './semanaAcumulada';

const dia = (etiqueta: string, actual: number, anterior: number): DiaDeLaSemana => ({
  dia: etiqueta,
  etiqueta,
  actual,
  anterior,
});

const SEMANA = [dia('Mar', 22, 15), dia('Mié', 18, 21), dia('Jue', 24, 19), dia('Vie', 20, 22)];

describe('acumularSemana', () => {
  it('suma día a día las ventas de cada semana', () => {
    expect(acumularSemana(SEMANA)).toEqual([
      { etiqueta: 'Mar', actual: 22, anterior: 15, delDia: 22, delDiaAnterior: 15 },
      { etiqueta: 'Mié', actual: 40, anterior: 36, delDia: 18, delDiaAnterior: 21 },
      { etiqueta: 'Jue', actual: 64, anterior: 55, delDia: 24, delDiaAnterior: 19 },
      { etiqueta: 'Vie', actual: 84, anterior: 77, delDia: 20, delDiaAnterior: 22 },
    ]);
  });

  it('un día sin ventas deja la línea plana, no la baja', () => {
    const plana = acumularSemana([dia('Mar', 5, 5), dia('Mié', 0, 3)]);
    expect(plana[1]).toEqual({
      etiqueta: 'Mié',
      actual: 5,
      anterior: 8,
      delDia: 0,
      delDiaAnterior: 3,
    });
  });

  it('sin días no hay nada que acumular', () => {
    expect(acumularSemana([])).toEqual([]);
  });
});

describe('resumenDeLaSemana', () => {
  it('arriba de la semana anterior', () => {
    expect(resumenDeLaSemana(SEMANA)).toEqual({
      titulo: 'Vas 7 ventas arriba',
      chip: '▲ 84 vs 77',
      estado: 'mejora',
    });
  });

  it('abajo de la semana anterior, y una sola venta va en singular', () => {
    expect(resumenDeLaSemana([dia('Mar', 4, 9)])).toMatchObject({
      titulo: 'Vas 5 ventas abajo',
      chip: '▼ 4 vs 9',
      estado: 'empeora',
    });
    expect(resumenDeLaSemana([dia('Mar', 4, 3)]).titulo).toBe('Vas 1 venta arriba');
  });

  it('igual que la semana anterior', () => {
    expect(resumenDeLaSemana([dia('Mar', 6, 6)])).toEqual({
      titulo: 'Vas igual que la semana pasada',
      chip: '= 6 vs 6',
      estado: 'igual',
    });
  });
});

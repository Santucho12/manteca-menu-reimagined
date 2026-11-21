import { describe, expect, it } from 'vitest';
import type { DiaDeLaSemana } from './semana';
import { AYUDAS_DE_LA_SEMANA, acumularSemana, resumenDeLaSemana } from './semanaAcumulada';

// Plata en centavos: cada dia de la semana lleva lo vendido, no cuantas ventas fueron.
const dia = (etiqueta: string, actual: number, anterior: number): DiaDeLaSemana => ({
  dia: etiqueta,
  etiqueta,
  actual,
  anterior,
});

const SEMANA = [
  dia('Mar', 2_200_000, 1_500_000),
  dia('Mié', 1_800_000, 2_100_000),
  dia('Jue', 2_400_000, 1_900_000),
  dia('Vie', 2_000_000, 2_200_000),
];

describe('acumularSemana', () => {
  it('suma día a día lo vendido en cada semana', () => {
    expect(acumularSemana(SEMANA)).toEqual([
      {
        etiqueta: 'Mar',
        actual: 2_200_000,
        anterior: 1_500_000,
        delDia: 2_200_000,
        delDiaAnterior: 1_500_000,
      },
      {
        etiqueta: 'Mié',
        actual: 4_000_000,
        anterior: 3_600_000,
        delDia: 1_800_000,
        delDiaAnterior: 2_100_000,
      },
      {
        etiqueta: 'Jue',
        actual: 6_400_000,
        anterior: 5_500_000,
        delDia: 2_400_000,
        delDiaAnterior: 1_900_000,
      },
      {
        etiqueta: 'Vie',
        actual: 8_400_000,
        anterior: 7_700_000,
        delDia: 2_000_000,
        delDiaAnterior: 2_200_000,
      },
    ]);
  });

  it('un día sin ventas deja la línea plana, no la baja', () => {
    const plana = acumularSemana([dia('Mar', 500, 500), dia('Mié', 0, 300)]);
    expect(plana[1]).toEqual({
      etiqueta: 'Mié',
      actual: 500,
      anterior: 800,
      delDia: 0,
      delDiaAnterior: 300,
    });
  });

  it('sin días no hay nada que acumular', () => {
    expect(acumularSemana([])).toEqual([]);
  });
});

describe('resumenDeLaSemana', () => {
  it('arriba de la semana anterior, en pesos', () => {
    expect(resumenDeLaSemana(SEMANA)).toEqual({
      titulo: 'Vas $7.000 arriba',
      chip: '▲ $84 k vs $77 k',
      estado: 'mejora',
    });
  });

  it('abajo de la semana anterior', () => {
    expect(resumenDeLaSemana([dia('Mar', 400_000, 900_000)])).toMatchObject({
      titulo: 'Vas $5.000 abajo',
      chip: '▼ $4 k vs $9 k',
      estado: 'empeora',
    });
  });

  it('igual que la semana anterior', () => {
    expect(resumenDeLaSemana([dia('Mar', 600_000, 600_000)])).toEqual({
      titulo: 'Vas igual que la semana pasada',
      chip: '= $6 k vs $6 k',
      estado: 'igual',
    });
  });
});

// Al pasar el mouse, cada etiqueta dice qué es (Santiago, 2026-11-20, pedido 102).
describe('las explicaciones de las etiquetas de la semana', () => {
  it('la frase explica la diferencia y la etiqueta las dos sumas', () => {
    expect(AYUDAS_DE_LA_SEMANA).toEqual({
      titulo:
        'Cuánto más o menos vendiste en los últimos 7 días, con lo de hoy hasta ahora, contra los 7 días anteriores.',
      chip: 'Lo vendido en los últimos 7 días contra lo vendido en los 7 días anteriores.',
    });
  });
});

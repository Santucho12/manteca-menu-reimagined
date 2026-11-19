import { describe, expect, it } from 'vitest';
import { filaDeCosto, precioSugerido, textoDelPorcentaje } from './calculo';

const MARGENES = { objetivo: 65, minimo: 50 };

describe('filaDeCosto', () => {
  it('una medialuna a $1.000 con costo $350 deja $650, el 65 %', () => {
    expect(filaDeCosto({ costo: 35_000, precio: 100_000, estado: 'ok' }, MARGENES)).toEqual({
      costo: 35_000,
      precio: 100_000,
      ganancia: 65_000,
      porcentaje: 65,
      sugerido: 100_000,
      debajo: false,
      motivo: null,
    });
  });

  it('debajo del minimo se marca', () => {
    const fila = filaDeCosto({ costo: 60_000, precio: 100_000, estado: 'ok' }, MARGENES);
    expect(fila).toMatchObject({ ganancia: 40_000, porcentaje: 40, debajo: true });
  });

  it('justo en el minimo no se marca', () => {
    const fila = filaDeCosto({ costo: 50_000, precio: 100_000, estado: 'ok' }, MARGENES);
    expect(fila.debajo).toBe(false);
  });

  it('sin costo dice por que, y sin precio tambien', () => {
    expect(
      filaDeCosto({ costo: null, precio: 100_000, estado: 'sin_receta' }, MARGENES),
    ).toMatchObject({
      ganancia: null,
      sugerido: null,
      debajo: false,
      motivo: 'Falta la receta',
    });
    expect(filaDeCosto({ costo: null, precio: 1, estado: 'sin_unidades' }, MARGENES).motivo).toBe(
      'Faltan las unidades',
    );
    expect(
      filaDeCosto({ costo: null, precio: 1, estado: 'insumo_sin_precio' }, MARGENES).motivo,
    ).toBe('Un insumo no tiene precio');
    const sinPrecio = filaDeCosto({ costo: 35_000, precio: null, estado: 'ok' }, MARGENES);
    expect(sinPrecio).toMatchObject({
      ganancia: null,
      sugerido: 100_000,
      motivo: 'Sin precio en el menú',
    });
  });
});

describe('precioSugerido', () => {
  it('redondea hacia arriba a $100', () => {
    // $351 / 0,35 = $1.002,86: sube a $1.100.
    expect(precioSugerido(35_100, 65)).toBe(110_000);
    expect(precioSugerido(35_000, 65)).toBe(100_000);
  });
});

describe('textoDelPorcentaje', () => {
  it('muestra un decimal si hace falta', () => {
    expect(textoDelPorcentaje(65)).toBe('65 %');
    expect(textoDelPorcentaje(33.3333)).toBe('33,3 %');
    expect(textoDelPorcentaje(-12.5)).toBe('-12,5 %');
  });
});

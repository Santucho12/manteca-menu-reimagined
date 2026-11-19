import { describe, expect, it } from 'vitest';
import { filasDeGanancia, totalesDeGanancia } from './ganancia';

const fila = (cambios = {}) => ({
  producto_id: 'p1',
  producto: 'Medialuna',
  unidades: 3,
  ventas_centavos: 300_000,
  costo_centavos: 70_000,
  ganancia_centavos: 130_000,
  sin_costo: 1,
  ...cambios,
});

describe('filasDeGanancia', () => {
  it('cada producto con su ganancia en pesos y en porcentaje de lo vendido con costo', () => {
    // Con costo se vendieron $2.000 y dejaron $1.300: el 65 %.
    expect(filasDeGanancia([fila()])).toEqual([
      {
        clave: 'p1',
        producto: 'Medialuna',
        unidades: 3,
        ventasCentavos: 300_000,
        costoCentavos: 70_000,
        gananciaCentavos: 130_000,
        porcentaje: 65,
        sinCosto: 1,
      },
    ]);
  });

  it('sin nada con costo no hay porcentaje', () => {
    const sinCosto = fila({ costo_centavos: 0, ganancia_centavos: 0, sin_costo: 2 });
    expect(filasDeGanancia([sinCosto])[0]!.porcentaje).toBeNull();
  });

  it('un renglon sin producto se agrupa por su descripcion', () => {
    expect(filasDeGanancia([fila({ producto_id: null, producto: 'Torta' })])[0]!.clave).toBe(
      'Torta',
    );
  });
});

describe('totalesDeGanancia', () => {
  it('suma ventas, costo, ganancia y los renglones sin costo', () => {
    const filas = filasDeGanancia([fila(), fila({ producto_id: 'p2', sin_costo: 0 })]);
    expect(totalesDeGanancia(filas)).toEqual({
      ventasCentavos: 600_000,
      costoCentavos: 140_000,
      gananciaCentavos: 260_000,
      sinCosto: 1,
    });
  });
});

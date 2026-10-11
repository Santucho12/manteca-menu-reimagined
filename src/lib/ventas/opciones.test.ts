import { describe, expect, it } from 'vitest';
import type { CategoriaDelPanel } from '../menu/panel';
import { opcionesDeVenta } from './opciones';

const precio = (presentacionId: string, presentacion: string, montoCentavos: number | null) => ({
  presentacionId,
  presentacion,
  montoCentavos,
  origen: montoCentavos === null ? null : ('propio' as const),
});

const panel = [
  {
    id: 'c1',
    nombre: 'Facturas',
    productos: [
      {
        id: 'p1',
        nombre: 'Medialuna',
        precios: [precio('u', 'Unidad', 90000), precio('d', 'Docena', null)],
      },
    ],
  },
] as unknown as CategoriaDelPanel[];

describe('opcionesDeVenta', () => {
  it('cada producto con cada presentacion que tiene precio, con ese precio', () => {
    expect(opcionesDeVenta(panel)).toEqual([
      { valor: 'p1|u', texto: 'Medialuna · Unidad', precioCentavos: 90000 },
    ]);
  });

  it('sin productos con precio, no hay opciones', () => {
    expect(opcionesDeVenta([])).toEqual([]);
  });
});

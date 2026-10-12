import { describe, expect, it } from 'vitest';
import {
  categoriasDelReporte,
  productosDelReporte,
  puntosDeVentas,
  ticketPromedio,
  totalesDeVentas,
} from './ventas';

const dias = [
  { dia: '2026-10-01', ventas: 2, monto_centavos: 300000 },
  { dia: '2026-10-02', ventas: 1, monto_centavos: 100001 },
];

const renglon = (
  producto_id: string | null,
  producto: string,
  presentacion: string,
  cantidad: number,
  monto_centavos: number,
) => ({
  producto_id,
  producto,
  categoria_id: null,
  categoria: null,
  presentacion,
  cantidad,
  monto_centavos,
});

describe('ventas del reporte', () => {
  it('suma monto y ventas y saca el ticket promedio en centavos enteros', () => {
    expect(totalesDeVentas(dias)).toEqual({
      montoCentavos: 400001,
      ventas: 3,
      ticketCentavos: 133334,
    });
    expect(totalesDeVentas([])).toEqual({ montoCentavos: 0, ventas: 0, ticketCentavos: null });
    expect(ticketPromedio(100, 3)).toBe(33);
  });

  it('pasa los dias a puntos', () => {
    expect(puntosDeVentas(dias)[0]).toEqual({
      clave: '2026-10-01',
      montoCentavos: 300000,
      cantidad: 2,
    });
  });

  it('agrupa los renglones por producto, con el detalle por presentacion', () => {
    const productos = productosDelReporte([
      renglon('p1', 'Medialuna', 'Unidad', 3, 30000),
      renglon('p1', 'Medialuna', 'Docena', 2, 200000),
      renglon(null, 'Chipa de Fudo', '', 4, 8000),
      renglon(null, 'Café de Fudo', '', 1, 5000),
      renglon('p2', 'Budín', 'Entero', 1, 90000),
    ]);
    expect(productos.map((p) => [p.nombre, p.montoCentavos])).toEqual([
      ['Medialuna', 230000],
      ['Budín', 90000],
      ['Sin vincular', 13000],
    ]);
    expect(productos[0]!.presentaciones).toEqual([
      { nombre: 'Docena', cantidad: 2, montoCentavos: 200000 },
      { nombre: 'Unidad', cantidad: 3, montoCentavos: 30000 },
    ]);
    expect(productos[2]!.presentaciones.map((p) => p.nombre)).toEqual([
      'Chipa de Fudo',
      'Café de Fudo',
    ]);
  });

  it('nombra las categorias y deja la de sin vincular con su clave', () => {
    expect(
      categoriasDelReporte([
        { categoria_id: 'c1', categoria: 'Panadería', ventas: 3, monto_centavos: 1000 },
        { categoria_id: null, categoria: 'Sin vincular', ventas: 1, monto_centavos: 10 },
      ]),
    ).toEqual([
      { clave: 'c1', nombre: 'Panadería', ventas: 3, montoCentavos: 1000 },
      { clave: 'sin-vincular', nombre: 'Sin vincular', ventas: 1, montoCentavos: 10 },
    ]);
  });
});

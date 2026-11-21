import { describe, expect, it } from 'vitest';
import { catalogoDeFilas, preciosAlDia, type FilaDelCatalogo } from './catalogo';

const fila = (
  categoria: string,
  producto: string,
  presentacion: string,
  precio: number,
): FilaDelCatalogo => ({
  categoria_id: `c-${categoria}`,
  categoria,
  producto_id: `p-${producto}`,
  producto,
  presentacion_id: `f-${producto}-${presentacion}`,
  presentacion,
  precio_centavos: precio,
});

describe('catalogoDeFilas', () => {
  it('junta las formas de venta de cada producto y los productos de cada categoría, en orden', () => {
    const catalogo = catalogoDeFilas([
      fila('Facturas', 'Medialuna', 'Docena', 1800000),
      fila('Facturas', 'Medialuna', 'Unidad', 200000),
      fila('Facturas', 'Vigilante', 'Unidad', 220000),
      fila('Cafetería', 'Café', 'Grande', 350000),
    ]);
    expect(catalogo.map((c) => c.nombre)).toEqual(['Facturas', 'Cafetería']);
    expect(catalogo[0]!.productos.map((p) => p.nombre)).toEqual(['Medialuna', 'Vigilante']);
    expect(catalogo[0]!.productos[0]!.formas).toMatchObject([
      {
        productoId: 'p-Medialuna',
        presentacionId: 'f-Medialuna-Docena',
        nombre: 'Medialuna',
        presentacion: 'Docena',
        precioCentavos: 1800000,
      },
      {
        productoId: 'p-Medialuna',
        presentacionId: 'f-Medialuna-Unidad',
        nombre: 'Medialuna',
        presentacion: 'Unidad',
        precioCentavos: 200000,
      },
    ]);
  });

  it('sin filas no hay categorías', () => {
    expect(catalogoDeFilas([])).toEqual([]);
  });
});

describe('preciosAlDia', () => {
  const catalogo = catalogoDeFilas([
    fila('Facturas', 'Medialuna', 'Docena', 1900000),
    fila('Facturas', 'Medialuna', 'Unidad', 200000),
  ]);
  const enElTicket = (presentacion: string, precio: number, cantidad = 1) => ({
    productoId: 'p-Medialuna',
    presentacionId: `f-Medialuna-${presentacion}`,
    nombre: 'Medialuna',
    presentacion,
    precioCentavos: precio,
    cantidad,
  });

  it('cada renglón toma el precio que tiene hoy el catálogo, con su cantidad', () => {
    expect(preciosAlDia([enElTicket('Docena', 1800000, 2)], catalogo)).toEqual([
      enElTicket('Docena', 1900000, 2),
    ]);
  });

  it('lo que ya no se vende sale del ticket', () => {
    expect(preciosAlDia([enElTicket('Media docena', 1000000)], catalogo)).toEqual([]);
  });
});

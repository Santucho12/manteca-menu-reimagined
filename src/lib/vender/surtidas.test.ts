import { describe, expect, it } from 'vitest';
import { catalogoDeFilas, type FilaDelCatalogo } from './catalogo';
import { esquemaVentaDelMostrador, ventaDelMostradorParaLaBase, ventaDelTicket } from './esquemas';
import { armadoCompleto, faltanParaArmar, surtidasDe } from './surtidas';

// Facturas surtidas (Santiago, 2026-11-20, pedido 102): se cobra la cantidad y se arma después.
const U = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;
const fila = (
  producto: number,
  pres: number,
  nombre: string,
  unidades: number,
  precio: number,
): FilaDelCatalogo => ({
  categoria_id: 'f',
  categoria: 'Facturas',
  producto_id: U(producto),
  producto: `Factura ${producto}`,
  presentacion_id: U(pres),
  presentacion: nombre,
  precio_centavos: precio,
  unidades,
  gramos: null,
  compartido: true,
});
const CATALOGO = catalogoDeFilas([
  fila(1, 5, 'Docena', 12, 2000000),
  fila(1, 6, 'Unidad', 1, 300000),
  fila(2, 5, 'Docena', 12, 2000000),
  fila(2, 6, 'Unidad', 1, 300000),
]);

describe('Surtidas en el catálogo', () => {
  it('por ahora está oculta: el catálogo no la trae (Santiago, 2026-11-20)', () => {
    expect(CATALOGO[0]!.productos.some((p) => p.nombre === 'Surtidas')).toBe(false);
  });

  it('la categoría con precio para todos tiene Surtidas, con sus formas', () => {
    const surtidas = surtidasDe(CATALOGO[0]!)!;
    expect(surtidas.nombre).toBe('Surtidas');
    expect(surtidas.formas.map((f) => [f.presentacion, f.surtida])).toEqual([
      ['Docena', true],
      ['Unidad', true],
    ]);
  });

  it('una surtida va a la base sin producto, marcada como surtida', () => {
    const docena = surtidasDe(CATALOGO[0]!)!.formas[0]!;
    const venta = esquemaVentaDelMostrador.parse({
      clave: U(9),
      ...ventaDelTicket([{ ...docena, cantidad: 1 }], [{ medio: 'qr', montoCentavos: 2000000 }]),
    });
    expect(ventaDelMostradorParaLaBase(venta).renglones[0]).toEqual({
      surtida: true,
      presentacion_id: U(5),
      cantidad: 1,
      precio_centavos: 2000000,
    });
  });
});

describe('armar', () => {
  it('cuenta lo que falta y sabe cuándo está completo', () => {
    expect(faltanParaArmar(12, { a: 4, b: 4 })).toBe(4);
    expect(armadoCompleto(12, { a: 6, b: 6 })).toBe(true);
    expect(armadoCompleto(12, { a: 6 })).toBe(false);
  });
});

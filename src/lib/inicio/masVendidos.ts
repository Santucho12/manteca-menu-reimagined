/**
 * Lo que Más vendidos aclara cuando el mes tiene ventas sin detalle de productos (las del Excel
 * de Fudo): sin ningún producto explica por qué, y con productos dice que esas ventas no cuentan.
 */
export function notaDeMasVendidos(productos: number, sinDetalle: number): string | null {
  if (sinDetalle === 0) return null;
  if (productos === 0) {
    return 'Las ventas de este mes entraron por el Excel de Fudo, que no trae productos. Acá aparecen los productos de las ventas cargadas a mano.';
  }
  return 'No cuenta las ventas del Excel de Fudo: ese archivo no trae productos.';
}

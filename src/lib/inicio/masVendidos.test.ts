import { describe, expect, it } from 'vitest';
import { notaDeMasVendidos } from './masVendidos';

describe('notaDeMasVendidos', () => {
  it('sin ventas sin detalle no hay nota', () => {
    expect(notaDeMasVendidos(3, 0)).toBeNull();
    expect(notaDeMasVendidos(0, 0)).toBeNull();
  });

  it('con ventas del Excel y ningun producto, explica por que no hay productos', () => {
    expect(notaDeMasVendidos(0, 12)).toBe(
      'Las ventas de este mes entraron por el Excel de Fudo, que no trae productos. Acá aparecen los productos de las ventas cargadas a mano.',
    );
  });

  it('con productos y ventas del Excel, aclara que estas no cuentan', () => {
    expect(notaDeMasVendidos(2, 12)).toBe(
      'No cuenta las ventas del Excel de Fudo: ese archivo no trae productos.',
    );
  });
});

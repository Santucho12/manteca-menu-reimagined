import { describe, expect, it } from 'vitest';
import { avisoDeQueda, quedaDeMas } from './queda';

describe('quedaDeMas', () => {
  it('queda mas de lo que se conto', () => {
    expect(quedaDeMas(9500000, 95000000)).toBe(true);
  });

  it('queda lo mismo o menos que lo contado', () => {
    expect(quedaDeMas(9500000, 9500000)).toBe(false);
    expect(quedaDeMas(9500000, 2000000)).toBe(false);
  });
});

describe('avisoDeQueda', () => {
  it('explica la diferencia con los dos montos', () => {
    expect(avisoDeQueda(9500000, 95000000)).toBe(
      'Quedan $950.000,00 en la caja pero se contaron $95.000,00 de efectivo: revisá el monto.',
    );
  });

  it('no avisa si el monto es posible', () => {
    expect(avisoDeQueda(9500000, 2000000)).toBeNull();
  });
});

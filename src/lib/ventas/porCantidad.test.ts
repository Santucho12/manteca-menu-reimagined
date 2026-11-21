import { describe, expect, it } from 'vitest';
import { precioPorCantidad } from './porCantidad';

// En el detalle, los renglones de la docena variada no muestran un precio raro (pedido 102).
const r = (id: string, cantidad: number, precio: number, subtotal: number) => ({
  id,
  cantidad,
  precio_unitario_centavos: precio,
  subtotal_centavos: subtotal,
});

describe('precioPorCantidad', () => {
  it('marca los renglones que se cobraron por cantidad y cuánto se ahorró', () => {
    const p = precioPorCantidad([
      r('a', 6, 300000, 1421052),
      r('b', 1, 2000000, 1578947),
      r('c', 2, 500000, 1000000),
    ]);
    expect([...p.ids]).toEqual(['a', 'b']);
    expect(p.cobradoCentavos).toBe(2999999);
    expect(p.ahorroCentavos).toBe(3800000 - 2999999);
  });

  it('sin docena variada no marca nada', () => {
    expect(precioPorCantidad([r('c', 2, 500000, 1000000)]).ids.size).toBe(0);
  });
});

describe('textoDelDescuento', () => {
  it('con porcentaje dice el porcentaje y el monto; si no, solo el monto', async () => {
    const { textoDelDescuento } = await import('./porCantidad');
    expect(textoDelDescuento(144400, 10)).toBe('10 % de descuento ($1.444,00)');
    expect(textoDelDescuento(180000, null)).toBe('Descuento fijo de $1.800,00');
  });
});

describe('el total cambiado a mano (pedido 102)', () => {
  it('se lee como total cambiado, no como descuento fijo', async () => {
    const { textoDelDescuento } = await import('./porCantidad');
    expect(textoDelDescuento(200000, null, 'total')).toBe('Total cambiado a mano (−$2.000,00)');
  });
});

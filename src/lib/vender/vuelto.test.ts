import { describe, expect, it } from 'vitest';
import { vueltoParaMostrar } from './vuelto';

// La ventana de vuelto que aparece al cobrar en efectivo (Santiago, 2026-11-20, pedido 102).
describe('vueltoParaMostrar', () => {
  it('con lo que pagaron, el vuelto', () => {
    expect(vueltoParaMostrar(3600000, '40.000')).toEqual({ vueltoCentavos: 400000 });
  });

  it('si pagaron justo, vuelto cero', () => {
    expect(vueltoParaMostrar(3600000, '36000')).toEqual({ vueltoCentavos: 0 });
  });

  it('si no alcanza, cuánto falta', () => {
    expect(vueltoParaMostrar(3600000, '30.000')).toEqual({ faltaCentavos: 600000 });
  });

  it('sin escribir o con algo que no es un monto, nada', () => {
    expect(vueltoParaMostrar(3600000, '')).toBeNull();
    expect(vueltoParaMostrar(3600000, 'abc')).toBeNull();
  });
});

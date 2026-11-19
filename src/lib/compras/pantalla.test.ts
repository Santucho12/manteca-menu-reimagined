import { describe, expect, it } from 'vitest';
import {
  enlaceDelPedido,
  estadoDeCompra,
  filtrosDeCompras,
  pagoDeCompra,
  textoDelPedido,
  totalDeLaCompra,
} from './pantalla';

describe('textoDelPedido', () => {
  it('arma el mensaje del pedido y el enlace de WhatsApp del proveedor', () => {
    const texto = textoDelPedido([
      { insumo: 'Harina 000', comoSeCompra: 'Bolsa de 25 kg', cantidad: 2 },
      { insumo: 'Azúcar', comoSeCompra: 'Bolsa de 50 kg', cantidad: 1.5 },
    ]);
    expect(texto).toBe(
      'Hola, te hago un pedido para Manteca:\n- 2 × Harina 000 (Bolsa de 25 kg)\n- 1,5 × Azúcar (Bolsa de 50 kg)\nGracias.',
    );
    expect(enlaceDelPedido('5491123456789', 'Hola')).toBe('https://wa.me/5491123456789?text=Hola');
    expect(enlaceDelPedido(null, 'Hola')).toBeNull();
  });
});

describe('totalDeLaCompra', () => {
  it('suma los renglones y los otros cargos, redondeando cada renglon', () => {
    expect(
      totalDeLaCompra(
        [
          { cantidad: 2, precioCentavos: 3_000_000 },
          { cantidad: 1.5, precioCentavos: 333 },
        ],
        50_000,
      ),
    ).toBe(6_050_500);
  });
});

describe('estado y pago', () => {
  it('se nombran como en la lista', () => {
    expect(estadoDeCompra({ estado: 'pedida', anulado: false })).toBe('Pedida');
    expect(estadoDeCompra({ estado: 'recibida', anulado: true })).toBe('Anulada');
    expect(pagoDeCompra({ gasto: true, vencimiento: null })).toBe('Pagada');
    expect(pagoDeCompra({ gasto: false, vencimiento: '2026-12-01' })).toBe(
      'Por pagar, vence el 01/12/2026',
    );
    expect(pagoDeCompra({ gasto: false, vencimiento: null })).toBe('—');
  });
});

describe('filtrosDeCompras', () => {
  it('lee el estado y el proveedor de la URL', () => {
    expect(filtrosDeCompras({ estado: 'pedida', proveedor: 'p1' })).toEqual({
      estado: 'pedida',
      proveedor: 'p1',
    });
    expect(filtrosDeCompras({ estado: 'otra' })).toEqual({ estado: 'todas', proveedor: null });
  });
});

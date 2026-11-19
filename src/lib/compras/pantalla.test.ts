import { describe, expect, it } from 'vitest';
import type { FormaParaComprar } from './formas';
import {
  enlaceDelPedido,
  formasDelProveedor,
  opcionesDeFormas,
  precioPropuesto,
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

const forma = (cambios: Partial<FormaParaComprar>): FormaParaComprar => ({
  id: 'f1',
  proveedorId: 'p1',
  insumo: 'Harina 000',
  unidad: 'g',
  comoSeCompra: 'Bolsa de 25 kg',
  contenido: 25000,
  ultimoPrecioCentavos: null,
  referenciaCentavos: 3_200_000,
  ...cambios,
});

describe('las formas de compra en el formulario', () => {
  it('ofrece las del proveedor y las que no tienen proveedor', () => {
    const formas = [
      forma({}),
      forma({ id: 'f2', proveedorId: 'otro' }),
      forma({ id: 'f3', proveedorId: null }),
    ];
    expect(formasDelProveedor(formas, 'p1').map((f) => f.id)).toEqual(['f1', 'f3']);
    expect(formasDelProveedor(formas, '')).toEqual([]);
  });

  it('cada opcion dice el insumo, como se compra y el ultimo precio o la referencia', () => {
    expect(
      opcionesDeFormas([forma({}), forma({ id: 'f2', ultimoPrecioCentavos: 3_000_000 })]),
    ).toEqual([
      { valor: '', texto: 'Elegí qué' },
      { valor: 'f1', texto: 'Harina 000 · Bolsa de 25 kg · referencia $32.000,00' },
      { valor: 'f2', texto: 'Harina 000 · Bolsa de 25 kg · última $30.000,00' },
    ]);
  });

  it('el precio que propone es el ultimo pagado o, si no, la referencia', () => {
    expect(precioPropuesto(forma({ ultimoPrecioCentavos: 3_000_000 }))).toBe('30.000');
    expect(precioPropuesto(forma({}))).toBe('32.000');
    expect(precioPropuesto(forma({ referenciaCentavos: null }))).toBe('');
  });
});

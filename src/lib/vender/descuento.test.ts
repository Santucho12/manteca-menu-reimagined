import { describe, expect, it } from 'vitest';
import { descuentoEnCentavos } from './descuento';

// El descuento en el cobro (Santiago, 2026-11-20, pedido 102): por porcentaje o por monto.
describe('descuentoEnCentavos', () => {
  it('por porcentaje, redondeado al centavo', () => {
    expect(descuentoEnCentavos(2000000, { tipo: 'porcentaje', valor: 10 })).toBe(200000);
    expect(descuentoEnCentavos(333333, { tipo: 'porcentaje', valor: 15 })).toBe(50000);
  });

  it('por monto, en pesos', () => {
    expect(descuentoEnCentavos(2000000, { tipo: 'monto', valor: 1500 })).toBe(150000);
  });

  it('nunca más que el total, y sin descuento es cero', () => {
    expect(descuentoEnCentavos(100000, { tipo: 'monto', valor: 5000 })).toBe(100000);
    expect(descuentoEnCentavos(100000, { tipo: 'porcentaje', valor: 150 })).toBe(100000);
    expect(descuentoEnCentavos(100000, null)).toBe(0);
  });
});

describe('el descuento al cobrar', () => {
  it('va a la base con su tipo, su valor y su motivo', async () => {
    const { esquemaVentaDelMostrador, ventaDelMostradorParaLaBase } = await import('./esquemas');
    const venta = esquemaVentaDelMostrador.parse({
      clave: '00000000-0000-4000-8000-000000000001',
      renglones: [
        {
          productoId: '00000000-0000-4000-8000-000000000002',
          presentacionId: '00000000-0000-4000-8000-000000000003',
          cantidad: 1,
          precioCentavos: 100000,
        },
      ],
      pagos: [{ medio: 'efectivo', montoCentavos: 90000 }],
      descuento: { tipo: 'porcentaje', valor: 10, motivo: 'Cliente de siempre' },
    });
    expect(ventaDelMostradorParaLaBase(venta).descuento).toEqual({
      tipo: 'porcentaje',
      valor: 10,
      motivo: 'Cliente de siempre',
    });
  });

  it('lo escrito en la pantalla vale si tiene número y motivo', async () => {
    const { descuentoEscrito } = await import('./descuento');
    expect(descuentoEscrito({ tipo: 'monto', valor: '1.500', motivo: 'Promo' })).toEqual({
      tipo: 'monto',
      valor: 1500,
      motivo: 'Promo',
    });
    expect(descuentoEscrito({ tipo: 'porcentaje', valor: '', motivo: 'Promo' })).toBeNull();
    expect(descuentoEscrito({ tipo: 'porcentaje', valor: '10', motivo: 'a' })).toBeNull();
  });
});

describe('el total final escrito a mano (pedido 102)', () => {
  it('descuenta la diferencia entre lo que suma y el total escrito', () => {
    expect(descuentoEnCentavos(2000000, { tipo: 'total', valor: 18000 })).toBe(200000);
    expect(descuentoEnCentavos(2000000, { tipo: 'total', valor: 25000 })).toBe(0);
  });
});

describe('el precio de un producto a mano (pedido 102)', () => {
  it('cuenta con el precio escrito y no entra en la docena variada', async () => {
    const { cuentaDeTicket } = await import('./ticket');
    const renglon = {
      productoId: 'p',
      presentacionId: 'u',
      nombre: 'Medialuna',
      presentacion: 'Unidad',
      precioCentavos: 300000,
      categoriaId: 'f',
      unidades: 1,
      compartido: true,
      cantidad: 12,
      precioEspecial: 250000,
    };
    const paquetes = {
      f: [
        { unidades: 12, precioCentavos: 2000000 },
        { unidades: 1, precioCentavos: 300000 },
      ],
    };
    const cuenta = cuentaDeTicket([renglon], paquetes);
    expect(cuenta.totalCentavos).toBe(3000000);
    expect(cuenta.variadas).toEqual([]);
  });
});

describe('cambiarPrecio', () => {
  it('pone el precio a mano y, sin precio, vuelve al del menú', async () => {
    const { cambiarPrecio, claveDe } = await import('./ticket');
    const r = {
      productoId: 'p',
      presentacionId: 'u',
      nombre: 'M',
      presentacion: 'U',
      precioCentavos: 300000,
      cantidad: 1,
    };
    const clave = claveDe(r);
    expect(cambiarPrecio([r], clave, 250000)[0]?.precioEspecial).toBe(250000);
    expect(cambiarPrecio(cambiarPrecio([r], clave, 250000), clave, undefined)[0]).toEqual(r);
  });
});

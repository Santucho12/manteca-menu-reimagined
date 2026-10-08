import { describe, expect, it } from 'vitest';
import { precioAumentado, vistaPrevia } from './aumento';

describe('precioAumentado', () => {
  it.each([
    [300000, 10, 10000, 330000],
    [380000, 7, 10000, 410000], // 4.066 -> 4.100
    [380000, 7, 5000, 405000], // 4.066 -> 4.050
    [415000, 0 + 10, 50000, 450000], // 4.565 -> 4.500
    [100000, 25, 50000, 150000], // 1.250 -> 1.500: la mitad redondea para arriba
    [450000, -10, 1000, 405000],
  ])('%i con %i%% y redondeo %i da %i', (monto, porcentaje, redondeo, esperado) => {
    expect(precioAumentado(monto, porcentaje, redondeo as 1000)).toBe(esperado);
  });

  it('un descuento fuerte con redondeo grande nunca deja un precio en cero', () => {
    expect(precioAumentado(100000, -50, 50000)).toBe(50000);
    // $100 con -50% da $50, que al $500 mas cercano seria $0: queda como estaba.
    expect(precioAumentado(10000, -50, 50000)).toBe(10000);
  });

  it('el redondeo nunca va en contra del porcentaje', () => {
    // $1.300 con -1% da $1.287, que al $500 mas cercano subiria a $1.500.
    expect(precioAumentado(130000, -1, 50000)).toBe(130000);
    // $1.200 con +1% da $1.212, que al $500 mas cercano bajaria a $1.000.
    expect(precioAumentado(120000, 1, 50000)).toBe(120000);
    // $300 con -10% y redondeo a $500: no puede terminar mas caro.
    expect(precioAumentado(30000, -10, 50000)).toBe(30000);
  });

  it('no pierde precision con montos grandes', () => {
    // $9.999.999 por tres son $29.999.997: al $10 mas cercano, $30.000.000.
    expect(precioAumentado(999999900, 200, 1000)).toBe(3000000000);
  });
});

describe('vistaPrevia', () => {
  it('agrega el precio nuevo a cada precio del alcance', () => {
    const base = {
      id: 'a',
      categoria: 'Facturas',
      producto: null,
      presentacion: 'Docena',
      montoCentavos: 2000000,
      oculto: false,
    };
    expect(vistaPrevia([base], 10, 10000)).toEqual([{ ...base, nuevoCentavos: 2200000 }]);
  });
});

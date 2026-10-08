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

  it('un precio chico con descuento fuerte no baja de un paso de redondeo', () => {
    expect(precioAumentado(100000, -50, 50000)).toBe(50000);
    expect(precioAumentado(10000, -50, 50000)).toBe(50000);
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

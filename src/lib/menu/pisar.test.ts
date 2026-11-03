import { describe, expect, it } from 'vitest';
import { preciosQuePisan, textoDelPrecioQuePisa } from './pisar';

const facturas = {
  id: 'c1',
  nombre: 'Facturas',
  presentaciones: [
    { id: 'docena', nombre: 'Docena' },
    { id: 'unidad', nombre: 'Unidad' },
  ],
  compartidos: [2000000, null],
};

const precio = (presentacionId: string, monto: string, original = '') => ({
  presentacionId,
  monto,
  original,
});

describe('preciosQuePisan', () => {
  it('un precio nuevo donde la categoría tiene uno para todos lo pisa', () => {
    expect(preciosQuePisan([precio('docena', '22000'), precio('unidad', '')], facturas)).toEqual([
      { presentacion: 'Docena', propioCentavos: 2200000, categoriaCentavos: 2000000 },
    ]);
  });

  it('donde la categoría no tiene precio para todos, cargar uno no pisa nada', () => {
    expect(preciosQuePisan([precio('unidad', '3500')], facturas)).toEqual([]);
  });

  it('cambiar un precio que ya era propio no pregunta: ya lo pisaba', () => {
    expect(preciosQuePisan([precio('docena', '23000', '22000')], facturas)).toEqual([]);
  });

  it('dejarlo vacío sigue tomando el de la categoría', () => {
    expect(preciosQuePisan([precio('docena', ' ')], facturas)).toEqual([]);
  });
});

describe('textoDelPrecioQuePisa', () => {
  it('dice cuánto va a costar en lugar del precio de la categoría', () => {
    expect(
      textoDelPrecioQuePisa({
        presentacion: 'Docena',
        propioCentavos: 2200000,
        categoriaCentavos: 2000000,
      }),
    ).toBe('Docena: $22.000 en lugar de $20.000');
  });
});

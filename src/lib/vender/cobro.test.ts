import { describe, expect, it } from 'vitest';
import { cobroElegido, estadoDelCobro, type EleccionDeCobro } from './cobro';

const eleccion = (cambios: Partial<EleccionDeCobro> = {}): EleccionDeCobro => ({
  medio: 'efectivo',
  dosMedios: false,
  segundoMedio: null,
  primeroEscrito: '',
  ...cambios,
});

describe('cobroElegido', () => {
  it('sin medio elegido todavía no hay cobro', () => {
    expect(cobroElegido(eleccion({ medio: null }))).toBeNull();
  });

  it('con un medio, es ese medio', () => {
    expect(cobroElegido(eleccion({ medio: 'qr' }))).toEqual({ medio: 'qr' });
  });

  it('con dos medios, falta elegir el segundo y escribir lo del primero', () => {
    expect(cobroElegido(eleccion({ dosMedios: true }))).toBeNull();
    expect(cobroElegido(eleccion({ dosMedios: true, segundoMedio: 'debito' }))).toBeNull();
  });

  it('con dos medios y lo del primero escrito en pesos, es el cobro en dos partes', () => {
    const elegido = eleccion({ dosMedios: true, segundoMedio: 'debito', primeroEscrito: '5.000' });
    expect(cobroElegido(elegido)).toEqual({
      medio: 'efectivo',
      segundoMedio: 'debito',
      montoDelPrimeroCentavos: 500000,
    });
  });

  it('lo del primero mal escrito no es un cobro', () => {
    const elegido = eleccion({ dosMedios: true, segundoMedio: 'qr', primeroEscrito: '5,000,1' });
    expect(cobroElegido(elegido)).toBeNull();
  });
});

describe('estadoDelCobro', () => {
  it('mientras falta elegir, no hay pagos ni aviso', () => {
    expect(estadoDelCobro(500000, eleccion({ medio: null }), '')).toEqual({
      pagos: null,
      aviso: null,
      vuelto: null,
    });
  });

  it('con un medio, el pago es el total', () => {
    expect(estadoDelCobro(500000, eleccion({ medio: 'qr' }), '').pagos).toEqual([
      { medio: 'qr', montoCentavos: 500000 },
    ]);
  });

  it('con dos medios mal repartidos avisa y no deja cobrar', () => {
    const elegido = eleccion({ dosMedios: true, segundoMedio: 'qr', primeroEscrito: '9.000' });
    expect(estadoDelCobro(500000, elegido, '')).toEqual({
      pagos: null,
      aviso: 'Con el primer medio va una parte: más de $0 y menos de $5.000,00.',
      vuelto: null,
    });
  });

  it('con lo que paga el cliente en efectivo, dice el vuelto o lo que falta', () => {
    expect(estadoDelCobro(1750000, eleccion(), '20.000').vuelto).toBe('Vuelto: $2.500,00');
    expect(estadoDelCobro(1750000, eleccion(), '10.000').vuelto).toBe(
      'Con eso no alcanza: faltan $7.500,00.',
    );
    expect(estadoDelCobro(1750000, eleccion(), '').vuelto).toBeNull();
  });
});

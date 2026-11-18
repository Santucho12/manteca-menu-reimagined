import { describe, expect, it } from 'vitest';
import { cobroElegido, type EleccionDeCobro } from './cobro';

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

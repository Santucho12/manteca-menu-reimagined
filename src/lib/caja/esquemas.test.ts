import { describe, expect, it } from 'vitest';
import {
  centavosDeCaja,
  cierreParaLaBase,
  esquemaCierre,
  esquemaEdicion,
  type DatosDeCierre,
} from './esquemas';

const datos: DatosDeCierre = {
  fecha: '2026-10-08',
  fondoInicial: '10.000',
  efectivo: '25.000,50',
  credito: '3.000',
  debito: '',
  qr: '0',
  transferencia: '1.500',
  quedaEnCaja: '10.000',
  comentario: '  ',
  retiros: [{ monto: '5.000', quien: ' Dueño ' }],
  gastos: [{ monto: '1.200', descripcion: 'Hielo' }],
};

describe('centavosDeCaja', () => {
  it.each([
    ['', 0],
    ['0', 0],
    ['0,00', 0],
    ['1.234,50', 123450],
  ])('"%s" son %i centavos', (texto, centavos) => {
    expect(centavosDeCaja(texto)).toBe(centavos);
  });

  it.each(['-5', '12,345', 'abc'])('rechaza "%s"', (texto) => {
    expect(centavosDeCaja(texto)).toBeUndefined();
  });
});

describe('esquemaCierre', () => {
  it('pasa a la base en centavos, con los medios vacios en cero', () => {
    expect(cierreParaLaBase(esquemaCierre.parse(datos))).toEqual({
      fecha: '2026-10-08',
      fondo_inicial_centavos: 1000000,
      efectivo_centavos: 2500050,
      credito_centavos: 300000,
      debito_centavos: 0,
      qr_centavos: 0,
      transferencia_centavos: 150000,
      queda_en_caja_centavos: 1000000,
      comentario: null,
      retiros: [{ monto_centavos: 500000, quien: 'Dueño' }],
      gastos: [{ monto_centavos: 120000, descripcion: 'Hielo' }],
    });
  });

  it('pide el efectivo contado y lo que queda en la caja', () => {
    const sinEfectivo = esquemaCierre.safeParse({ ...datos, efectivo: '' });
    expect(sinEfectivo.error?.issues[0]?.message).toBe('Escribí cuánto efectivo hay en la caja.');
    expect(esquemaCierre.safeParse({ ...datos, quedaEnCaja: '' }).success).toBe(false);
  });

  it('un retiro pide monto y quien; un gasto, monto y descripcion', () => {
    expect(
      esquemaCierre.safeParse({ ...datos, retiros: [{ monto: '0', quien: 'Dueño' }] }).success,
    ).toBe(false);
    expect(
      esquemaCierre.safeParse({ ...datos, retiros: [{ monto: '100', quien: '' }] }).success,
    ).toBe(false);
    expect(
      esquemaCierre.safeParse({ ...datos, gastos: [{ monto: '100', descripcion: '' }] }).success,
    ).toBe(false);
  });

  it('una fecha imposible no pasa', () => {
    expect(esquemaCierre.safeParse({ ...datos, fecha: '2026-02-30' }).success).toBe(false);
  });
});

describe('esquemaEdicion', () => {
  it('pide el id del cierre', () => {
    expect(esquemaEdicion.safeParse(datos).success).toBe(false);
    const id = '6f1c1e0a-2b1d-4c1e-9a6b-1f2e3d4c5b6a';
    expect(esquemaEdicion.safeParse({ ...datos, id }).success).toBe(true);
  });
});

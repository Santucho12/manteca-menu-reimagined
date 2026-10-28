import { describe, expect, it } from 'vitest';
import { datosParaEditar } from './paraEditar';

const cierre = {
  fecha: '2026-10-28',
  fondoInicialCentavos: 1000000,
  quedaEnCajaCentavos: 800000,
  comentario: null,
  declarados: { efectivo: 2500050, credito: 0, debito: 0, qr: 1500000, transferencia: 0 },
  retiros: [{ monto_centavos: 500000, quien: 'Dueño' }],
  gastos: [
    { id: 'a', monto_centavos: 120000, descripcion: 'Hielo', anulado: false },
    { id: 'b', monto_centavos: 99000, descripcion: 'Viejo', anulado: true },
  ],
};

describe('datosParaEditar', () => {
  it('vuelve los centavos al texto del formulario y deja afuera los gastos anulados', () => {
    expect(datosParaEditar(cierre)).toEqual({
      fecha: '2026-10-28',
      fondoInicial: '10.000',
      efectivo: '25.000,50',
      credito: '',
      debito: '',
      qr: '15.000',
      transferencia: '',
      quedaEnCaja: '8.000',
      comentario: '',
      retiros: [{ monto: '5.000', quien: 'Dueño' }],
      gastos: [{ monto: '1.200', descripcion: 'Hielo' }],
    });
  });
});

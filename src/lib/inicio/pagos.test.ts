import { describe, expect, it } from 'vitest';
import { pagosParaAvisar } from './pagos';

const HOY = '2026-11-14';
const pago = (clave: string, fecha: string) => ({ clave, fecha });

describe('pagosParaAvisar', () => {
  it('cuenta lo vencido y lo de la semana, y deja afuera lo que viene despues', () => {
    const pagos = [
      pago('ayer', '2026-11-13'),
      pago('hoy', '2026-11-14'),
      pago('en-6-dias', '2026-11-20'),
      pago('en-7-dias', '2026-11-21'),
    ];
    expect(pagosParaAvisar(pagos, HOY)).toEqual({ vencidos: 1, estaSemana: 2, unico: null });
  });

  it('si en total es uno solo, da su clave', () => {
    expect(pagosParaAvisar([pago('luz', '2026-11-13')], HOY)).toEqual({
      vencidos: 1,
      estaSemana: 0,
      unico: 'luz',
    });
    expect(pagosParaAvisar([pago('fijo|2026-11-16', '2026-11-16')], HOY).unico).toBe(
      'fijo|2026-11-16',
    );
  });

  it('un pago lejano no cuenta, ni siquiera como el unico', () => {
    expect(pagosParaAvisar([pago('lejos', '2026-12-30')], HOY)).toEqual({
      vencidos: 0,
      estaSemana: 0,
      unico: null,
    });
  });

  it('sin pagos no hay nada que avisar', () => {
    expect(pagosParaAvisar([], HOY)).toEqual({ vencidos: 0, estaSemana: 0, unico: null });
  });
});

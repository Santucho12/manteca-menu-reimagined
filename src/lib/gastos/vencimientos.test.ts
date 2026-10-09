import { describe, expect, it } from 'vitest';
import { proximoVencimiento, sumarMeses } from './vencimientos';

describe('sumarMeses', () => {
  it.each([
    ['2026-01-31', 1, '2026-02-28'],
    ['2026-01-31', 2, '2026-03-31'],
    ['2028-02-29', 12, '2029-02-28'],
    ['2026-11-15', 2, '2027-01-15'],
    ['2026-03-10', 0, '2026-03-10'],
  ])('%s mas %i meses es %s', (fecha, meses, esperado) => {
    expect(sumarMeses(fecha, meses)).toBe(esperado);
  });
});

describe('proximoVencimiento', () => {
  it('es el primero si todavia no llego', () => {
    expect(proximoVencimiento('2026-12-01', 'mensual', '2026-10-08')).toBe('2026-12-01');
  });

  it('cuenta desde el primero, con el ultimo dia en los meses cortos', () => {
    expect(proximoVencimiento('2026-01-31', 'mensual', '2026-02-10')).toBe('2026-02-28');
    expect(proximoVencimiento('2026-01-31', 'mensual', '2026-03-01')).toBe('2026-03-31');
  });

  it('el mismo dia del vencimiento es ese', () => {
    expect(proximoVencimiento('2026-01-10', 'mensual', '2026-10-10')).toBe('2026-10-10');
  });

  it('bimestral y anual', () => {
    expect(proximoVencimiento('2026-01-15', 'bimestral', '2026-02-01')).toBe('2026-03-15');
    expect(proximoVencimiento('2028-02-29', 'anual', '2029-01-01')).toBe('2029-02-28');
  });
});

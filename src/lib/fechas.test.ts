import { describe, expect, it } from 'vitest';
import { diaEnArgentina } from './fechas';

describe('diaEnArgentina', () => {
  it('una venta de las 23:30 de Argentina cae en ese dia, aunque en UTC ya sea el siguiente', () => {
    expect(diaEnArgentina(new Date('2026-10-07T02:30:00Z'))).toBe('2026-10-06');
  });

  it('una venta de las 00:30 de Argentina cae en el dia nuevo', () => {
    expect(diaEnArgentina(new Date('2026-10-07T03:30:00Z'))).toBe('2026-10-07');
  });

  it('respeta el cambio de año', () => {
    expect(diaEnArgentina(new Date('2027-01-01T02:59:59Z'))).toBe('2026-12-31');
  });

  it('rechaza una fecha invalida', () => {
    expect(() => diaEnArgentina(new Date('no es una fecha'))).toThrow('no es válida');
  });
});

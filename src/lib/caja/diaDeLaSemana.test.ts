import { describe, expect, it } from 'vitest';
import { diaDeLaSemana } from './diaDeLaSemana';

describe('diaDeLaSemana', () => {
  it('da el dia abreviado de una fecha', () => {
    expect(diaDeLaSemana('2026-10-28')).toBe('mié');
    expect(diaDeLaSemana('2026-10-25')).toBe('dom');
  });

  it('no depende de la hora del equipo', () => {
    expect(diaDeLaSemana('2026-10-26')).toBe('lun');
  });
});

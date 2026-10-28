import { describe, expect, it } from 'vitest';
import {
  esElMesDeHoy,
  mesAnterior,
  mesDeLaUrl,
  mesSiguiente,
  nombreDelMes,
  rangoDelMes,
} from './meses';

const HOY = '2026-10-27';

describe('mesDeLaUrl', () => {
  it('sin mes, el de hoy', () => {
    expect(mesDeLaUrl(undefined, HOY)).toBe('2026-10');
  });

  it('un mes que ya pasó', () => {
    expect(mesDeLaUrl('2026-07', HOY)).toBe('2026-07');
    expect(mesDeLaUrl('2025-12', HOY)).toBe('2025-12');
  });

  it('uno inválido o futuro vuelve al de hoy', () => {
    for (const texto of ['2026-13', 'hola', '2026-1', '2026-11', '2027-01']) {
      expect(mesDeLaUrl(texto, HOY)).toBe('2026-10');
    }
  });
});

describe('mesAnterior y mesSiguiente', () => {
  it('cruzan el año', () => {
    expect(mesAnterior('2026-01')).toBe('2025-12');
    expect(mesSiguiente('2026-12')).toBe('2027-01');
    expect(mesSiguiente('2026-10')).toBe('2026-11');
  });
});

describe('rangoDelMes', () => {
  it('del primero al último día', () => {
    expect(rangoDelMes('2026-02')).toEqual({ desde: '2026-02-01', hasta: '2026-02-28' });
    expect(rangoDelMes('2028-02').hasta).toBe('2028-02-29');
    expect(rangoDelMes('2026-10').hasta).toBe('2026-10-31');
  });
});

describe('nombreDelMes y esElMesDeHoy', () => {
  it('el nombre en castellano', () => {
    expect(nombreDelMes('2026-10')).toBe('octubre 2026');
    expect(nombreDelMes('2027-01')).toBe('enero 2027');
  });

  it('compara con hoy', () => {
    expect(esElMesDeHoy('2026-10', HOY)).toBe(true);
    expect(esElMesDeHoy('2026-09', HOY)).toBe(false);
  });
});

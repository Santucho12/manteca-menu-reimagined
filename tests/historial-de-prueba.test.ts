import { describe, expect, it } from 'vitest';
import { primerosDiasDeLosMeses } from './historial-de-prueba';

describe('primerosDiasDeLosMeses', () => {
  it('el primer dia de este mes y de los tres anteriores, cruzando el año', () => {
    expect(primerosDiasDeLosMeses('2026-02-19')).toEqual([
      '2026-02-01',
      '2026-01-01',
      '2025-12-01',
      '2025-11-01',
    ]);
  });
});

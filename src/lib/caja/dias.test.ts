import { describe, expect, it } from 'vitest';
import { diasSinCierre } from './dias';

describe('diasSinCierre', () => {
  it('los dias del rango que no tienen cierre', () => {
    const faltan = diasSinCierre({
      desde: '2026-10-01',
      hasta: '2026-10-05',
      conCierre: ['2026-10-01', '2026-10-03'],
      primero: '2026-09-01',
      hoy: '2026-10-08',
    });
    expect(faltan).toEqual(['2026-10-05', '2026-10-04', '2026-10-02']);
  });

  it('no pasa de hoy ni va antes del primer cierre', () => {
    const faltan = diasSinCierre({
      desde: '2026-10-01',
      hasta: '2026-10-31',
      conCierre: ['2026-10-06'],
      primero: '2026-10-06',
      hoy: '2026-10-08',
    });
    expect(faltan).toEqual(['2026-10-08', '2026-10-07']);
  });

  it('sin ningun cierre todavia, no marca nada', () => {
    const faltan = diasSinCierre({
      desde: '2026-10-01',
      hasta: '2026-10-31',
      conCierre: [],
      primero: null,
      hoy: '2026-10-08',
    });
    expect(faltan).toEqual([]);
  });

  it('cruza fin de mes', () => {
    const faltan = diasSinCierre({
      desde: '2026-02-27',
      hasta: '2026-03-01',
      conCierre: [],
      primero: '2026-01-01',
      hoy: '2026-10-08',
    });
    expect(faltan).toEqual(['2026-03-01', '2026-02-28', '2026-02-27']);
  });
});

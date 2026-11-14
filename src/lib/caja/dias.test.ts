import { describe, expect, it } from 'vitest';
import { diasQueNoAbrio, diasSinCierre } from './dias';

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

  it('no cuenta los dias que el local no abrio', () => {
    const faltan = diasSinCierre({
      desde: '2026-10-01',
      hasta: '2026-10-05',
      conCierre: ['2026-10-01'],
      sinAbrir: ['2026-10-03'],
      primero: '2026-09-01',
      hoy: '2026-10-08',
    });
    expect(faltan).toEqual(['2026-10-05', '2026-10-04', '2026-10-02']);
  });
});

describe('diasQueNoAbrio', () => {
  it('los marcados, del mas nuevo al mas viejo, sin el que ya tiene cierre', () => {
    const dias = diasQueNoAbrio({
      conCierre: ['2026-10-03'],
      sinAbrir: ['2026-10-02', '2026-10-04', '2026-10-03'],
    });
    expect(dias).toEqual(['2026-10-04', '2026-10-02']);
  });

  it('sin marcas no hay ninguno', () => {
    expect(diasQueNoAbrio({ conCierre: ['2026-10-03'], sinAbrir: [] })).toEqual([]);
  });
});

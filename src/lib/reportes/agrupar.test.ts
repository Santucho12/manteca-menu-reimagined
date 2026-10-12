import { describe, expect, it } from 'vitest';
import { agrupar, clavesDe, escalaDe, etiquetaDe, serieSuperpuesta } from './agrupar';

const punto = (clave: string, montoCentavos: number, cantidad = 1) => ({
  clave,
  montoCentavos,
  cantidad,
});

describe('agrupar', () => {
  it('va por dia hasta 62 dias y por mes si es mas largo', () => {
    expect(escalaDe({ desde: '2026-01-01', hasta: '2026-03-03' })).toBe('dia');
    expect(escalaDe({ desde: '2026-01-01', hasta: '2026-03-04' })).toBe('mes');
  });

  it('junta los dias de cada mes', () => {
    const dias = [
      punto('2026-01-05', 100, 2),
      punto('2026-01-20', 50, 1),
      punto('2026-02-01', 70, 3),
    ];
    expect(agrupar(dias, 'mes')).toEqual([punto('2026-01', 150, 3), punto('2026-02', 70, 3)]);
    expect(agrupar(dias, 'dia')).toEqual(dias);
  });

  it('lista cada dia o cada mes del periodo, cruzando el año', () => {
    expect(clavesDe({ desde: '2026-12-30', hasta: '2027-01-02' }, 'dia')).toEqual([
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
    ]);
    expect(clavesDe({ desde: '2026-11-15', hasta: '2027-02-01' }, 'mes')).toEqual([
      '2026-11',
      '2026-12',
      '2027-01',
      '2027-02',
    ]);
  });

  it('superpone los dos periodos posicion con posicion, con cero donde no hubo', () => {
    const serie = serieSuperpuesta(
      { periodo: { desde: '2026-10-01', hasta: '2026-10-03' }, puntos: [punto('2026-10-02', 500)] },
      { periodo: { desde: '2026-09-29', hasta: '2026-09-30' }, puntos: [punto('2026-09-29', 300)] },
      'dia',
    );
    expect(serie).toEqual([
      { posicion: 1, etiqueta: '01/10', actual: 0, comparacion: 300 },
      { posicion: 2, etiqueta: '02/10', actual: 500, comparacion: 0 },
      { posicion: 3, etiqueta: '03/10', actual: 0, comparacion: null },
    ]);
  });

  it('los dias que todavia no pasaron no tienen punto, en vez de caer a cero', () => {
    const serie = serieSuperpuesta(
      { periodo: { desde: '2026-10-01', hasta: '2026-10-03' }, puntos: [punto('2026-10-01', 500)] },
      { periodo: { desde: '2026-09-28', hasta: '2026-09-30' }, puntos: [] },
      'dia',
      '2026-10-02',
    );
    expect(serie.map((p) => p.actual)).toEqual([500, 0, null]);
    expect(serie.map((p) => p.comparacion)).toEqual([0, 0, 0]);
  });

  it('por mes, el mes que todavia no empezo no tiene punto', () => {
    const serie = serieSuperpuesta(
      { periodo: { desde: '2026-10-01', hasta: '2026-12-31' }, puntos: [] },
      { periodo: { desde: '2026-07-01', hasta: '2026-09-30' }, puntos: [] },
      'mes',
      '2026-11-15',
    );
    expect(serie.map((p) => p.actual)).toEqual([0, 0, null]);
  });

  it('etiqueta los meses con su nombre corto', () => {
    expect(etiquetaDe('2026-10', 'mes')).toBe('oct 2026');
  });
});

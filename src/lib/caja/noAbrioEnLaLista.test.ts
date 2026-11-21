import { describe, expect, it } from 'vitest';
import { filasConNoAbrio } from './noAbrioEnLaLista';

const cierre = (fecha: string) => ({ id: fecha, fecha });

describe('los días que el local no abrió, dentro de la lista de cierres (Santiago, 2026-11-20)', () => {
  it('van en su fecha, de la más nueva a la más vieja', () => {
    const filas = filasConNoAbrio(
      [cierre('2026-11-18'), cierre('2026-11-15')],
      ['2026-11-16', '2026-11-19'],
      true,
      true,
    );
    expect(filas.map((f) => f.fecha)).toEqual([
      '2026-11-19',
      '2026-11-18',
      '2026-11-16',
      '2026-11-15',
    ]);
    expect(filas[0]).toEqual({ noAbrio: true, fecha: '2026-11-19' });
  });

  it('con varias páginas, cada día va solo en la página de su fecha', () => {
    const pagina = [cierre('2026-11-18'), cierre('2026-11-15')];
    const dias = ['2026-11-20', '2026-11-16', '2026-11-10'];
    const medio = filasConNoAbrio(pagina, dias, false, false).map((f) => f.fecha);
    expect(medio).toEqual(['2026-11-18', '2026-11-16', '2026-11-15']);
    const primera = filasConNoAbrio(pagina, dias, true, false).map((f) => f.fecha);
    expect(primera).toEqual(['2026-11-20', '2026-11-18', '2026-11-16', '2026-11-15']);
  });

  it('sin cierres, la lista son los días que no abrió', () => {
    expect(filasConNoAbrio([], ['2026-11-16'], true, true)).toEqual([
      { noAbrio: true, fecha: '2026-11-16' },
    ]);
  });
});

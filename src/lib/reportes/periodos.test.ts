import { describe, expect, it } from 'vitest';
import {
  atajos,
  diasDe,
  enlaceDeReporte,
  periodoAnterior,
  periodosDelReporte,
  sumarDias,
  textoDePeriodo,
} from './periodos';

const OCTUBRE = { desde: '2026-10-01', hasta: '2026-10-31' };

describe('periodos', () => {
  it('suma y resta dias cruzando meses y años', () => {
    expect(sumarDias('2026-03-01', -1)).toBe('2026-02-28');
    expect(sumarDias('2024-03-01', -1)).toBe('2024-02-29');
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('cuenta los dias de un periodo con sus dos puntas', () => {
    expect(diasDe(OCTUBRE)).toBe(31);
    expect(diasDe({ desde: '2026-10-05', hasta: '2026-10-05' })).toBe(1);
  });

  it('el periodo anterior tiene el mismo largo y termina el dia antes', () => {
    expect(periodoAnterior(OCTUBRE)).toEqual({ desde: '2026-08-31', hasta: '2026-09-30' });
    expect(periodoAnterior({ desde: '2027-01-01', hasta: '2027-01-07' })).toEqual({
      desde: '2026-12-25',
      hasta: '2026-12-31',
    });
  });

  it('sin fechas en la URL es el mes de hoy contra el periodo anterior', () => {
    expect(periodosDelReporte({}, '2026-10-11')).toEqual({
      actual: OCTUBRE,
      comparacion: { desde: '2026-08-31', hasta: '2026-09-30' },
      comparacionElegida: false,
      pagina: 1,
    });
  });

  it('ordena desde y hasta dados vuelta e ignora fechas que no existen', () => {
    const leidos = periodosDelReporte(
      {
        desde: '2026-10-20',
        hasta: '2026-10-10',
        cdesde: '2026-02-30',
        chasta: '2026-03-01',
        pagina: '3',
      },
      '2026-10-11',
    );
    expect(leidos.actual).toEqual({ desde: '2026-10-10', hasta: '2026-10-20' });
    expect(leidos.comparacionElegida).toBe(false);
    expect(leidos.pagina).toBe(3);
  });

  it('usa la comparacion elegida cuando vienen sus dos fechas', () => {
    const leidos = periodosDelReporte(
      { ...OCTUBRE, cdesde: '2025-10-01', chasta: '2025-10-31' },
      '2026-10-11',
    );
    expect(leidos.comparacion).toEqual({ desde: '2025-10-01', hasta: '2025-10-31' });
    expect(leidos.comparacionElegida).toBe(true);
  });

  it('arma los atajos de hoy', () => {
    expect(atajos('2026-01-15')).toEqual([
      { texto: 'Este mes', periodo: { desde: '2026-01-01', hasta: '2026-01-31' } },
      { texto: 'Mes pasado', periodo: { desde: '2025-12-01', hasta: '2025-12-31' } },
      { texto: 'Últimos 7 días', periodo: { desde: '2026-01-09', hasta: '2026-01-15' } },
    ]);
  });

  it('arma el enlace con la comparacion y la pagina solo si hacen falta', () => {
    const ruta = '/admin/reportes/ventas';
    expect(enlaceDeReporte(ruta, { actual: OCTUBRE })).toBe(
      `${ruta}?desde=2026-10-01&hasta=2026-10-31`,
    );
    const comparacion = { desde: '2025-10-01', hasta: '2025-10-31' };
    expect(enlaceDeReporte(ruta, { actual: OCTUBRE, comparacion, pagina: 2 })).toBe(
      `${ruta}?desde=2026-10-01&hasta=2026-10-31&cdesde=2025-10-01&chasta=2025-10-31&pagina=2`,
    );
  });

  it('muestra un periodo como texto', () => {
    expect(textoDePeriodo(OCTUBRE)).toBe('del 01/10/2026 al 31/10/2026');
  });
});

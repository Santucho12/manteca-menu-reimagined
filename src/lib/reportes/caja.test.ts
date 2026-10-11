import { describe, expect, it } from 'vitest';
import { diferenciasDelGrafico, filasDeCaja, resumenPorEmpleado, textoDeDiferencia } from './caja';

const cierre = (fecha: string, persona: string, diferenciaCentavos: number | null) => ({
  fecha,
  persona,
  declaradoCentavos: 2000000,
  diferenciaCentavos,
});

describe('reporte de caja', () => {
  it('marca los dias sin cierre desde el primer cierre hasta ayer', () => {
    const filas = filasDeCaja(
      [cierre('2026-10-02', 'Ana', null), cierre('2026-10-04', 'Beto', -5000)],
      { desde: '2026-09-30', hasta: '2026-10-31' },
      '2026-10-02',
      '2026-10-06',
    );
    expect(filas.map((f) => [f.fecha, f.cierre?.persona ?? null])).toEqual([
      ['2026-10-05', null],
      ['2026-10-04', 'Beto'],
      ['2026-10-03', null],
      ['2026-10-02', 'Ana'],
    ]);
  });

  it('resume por empleado, sumando solo las diferencias que hay', () => {
    const cierres = [
      cierre('2026-10-02', 'Beto', null),
      cierre('2026-10-03', 'Ana', -5000),
      cierre('2026-10-04', 'Ana', 2000),
      cierre('2026-10-05', 'Beto', null),
    ];
    expect(resumenPorEmpleado(cierres)).toEqual([
      { persona: 'Ana', cierres: 2, diferenciaCentavos: -3000 },
      { persona: 'Beto', cierres: 2, diferenciaCentavos: null },
    ]);
  });

  it('dice esperando ventas mientras no hay diferencia', () => {
    expect(textoDeDiferencia(null)).toBe('Esperando ventas');
    expect(textoDeDiferencia(-5000)).toBe('-$50,00');
  });
});

describe('diferenciasDelGrafico', () => {
  it('lleva solo los cierres que ya tienen diferencia, del mas viejo al mas nuevo', () => {
    expect(
      diferenciasDelGrafico([
        cierre('2026-10-04', 'Beto', -5000),
        cierre('2026-10-03', 'Ana', null),
        cierre('2026-10-02', 'Ana', 2000),
      ]),
    ).toEqual([
      { nombre: '02/10/2026', montoCentavos: 2000 },
      { nombre: '04/10/2026', montoCentavos: -5000 },
    ]);
  });
});

import { describe, expect, it } from 'vitest';
import { diferenciasDelGrafico, filasDeCaja, resumenPorEmpleado } from './caja';

const cierre = (fecha: string, persona: string, diferenciaCentavos: number | null) => ({
  fecha,
  turno: 2 as const,
  persona,
  declaradoCentavos: 2000000,
  diferenciaCentavos,
});

describe('reporte de caja', () => {
  it('suma los turnos pendientes y los días que no abrió, del más nuevo al más viejo', () => {
    const filas = filasDeCaja(
      [
        { ...cierre('2026-10-02', 'Ana', null), turno: 2 },
        { ...cierre('2026-10-04', 'Beto', -5000), turno: 1 },
      ],
      [
        { fecha: '2026-10-04', turno: 2 },
        { fecha: '2026-10-03', turno: 1 },
      ],
      ['2026-10-05'],
    );
    expect(filas.map((f) => [f.fecha, f.turno, f.cierre?.persona ?? null, f.noAbrio])).toEqual([
      ['2026-10-05', null, null, true],
      ['2026-10-04', 2, null, false],
      ['2026-10-04', 1, 'Beto', false],
      ['2026-10-03', 1, null, false],
      ['2026-10-02', 2, 'Ana', false],
    ]);
  });

  it('un día que no abrió pero tiene cierre no se marca', () => {
    const filas = filasDeCaja(
      [{ ...cierre('2026-10-02', 'Ana', null), turno: 2 }],
      [],
      ['2026-10-02'],
    );
    expect(filas).toHaveLength(1);
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

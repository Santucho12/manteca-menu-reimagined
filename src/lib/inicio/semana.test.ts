import { describe, expect, it } from 'vitest';
import { rangoDeSemanas, semanaContraSemana } from './semana';

// 2026-10-21 es miercoles: los 7 dias son del jueves 15 al miercoles 21 (hoy), contra los 7 anteriores.
const HOY = '2026-10-21';
// El grafico cuenta ventas, no plata: el monto no importa.
const venta = (dia: string, ventas: number) => ({ dia, ventas, monto_centavos: 0 });

describe('rangoDeSemanas', () => {
  it('va desde hace 13 dias hasta hoy, para traer las dos semanas', () =>
    expect(rangoDeSemanas(HOY)).toEqual({ desde: '2026-10-08', hasta: '2026-10-21' }));
});

describe('semanaContraSemana', () => {
  const ventas = [venta('2026-10-21', 50), venta('2026-10-14', 30), venta('2026-10-08', 9)];
  const semana = semanaContraSemana(ventas, HOY);

  it('son 7 dias, del jueves al miercoles, de viejo a nuevo, con hoy', () => {
    expect(semana.map((d) => d.etiqueta)).toEqual([
      'Jueves',
      'Viernes',
      'Sábado',
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
    ]);
    expect(semana[0]!.dia).toBe('2026-10-15');
    expect(semana[6]!.dia).toBe('2026-10-21');
  });
  it('cada dia se compara con el mismo dia de la semana anterior', () => {
    expect(semana[6]).toMatchObject({ actual: 50, anterior: 30 });
    expect(semana[0]).toMatchObject({ actual: 0, anterior: 9 });
  });
  it('un dia sin ventas queda en cero', () => {
    expect(semana[1]).toMatchObject({ actual: 0, anterior: 0 });
    expect(semanaContraSemana([], HOY).every((d) => d.actual === 0 && d.anterior === 0)).toBe(true);
  });
  it('si hoy es lunes, arranca el martes y termina el lunes', () => {
    const etiquetas = semanaContraSemana([], '2026-10-19').map((d) => d.etiqueta);
    expect(etiquetas[0]).toBe('Martes');
    expect(etiquetas[6]).toBe('Lunes');
  });
});

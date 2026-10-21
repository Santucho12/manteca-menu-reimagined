import { describe, expect, it } from 'vitest';
import { rangoDeSemanas, semanaContraSemana } from './semana';

// 2026-10-21 es miercoles: la semana va del lunes 19 al domingo 25, contra el lunes 12 al domingo 18.
const HOY = '2026-10-21';
// El grafico cuenta ventas, no plata: el monto no importa.
const venta = (dia: string, ventas: number) => ({ dia, ventas, monto_centavos: 0 });

describe('rangoDeSemanas', () => {
  it('va del lunes de la semana anterior al domingo de esta', () =>
    expect(rangoDeSemanas('2026-10-21')).toEqual({ desde: '2026-10-12', hasta: '2026-10-25' }));
});

describe('semanaContraSemana', () => {
  const ventas = [venta('2026-10-21', 50), venta('2026-10-14', 30), venta('2026-10-12', 9)];
  const semana = semanaContraSemana(ventas, HOY);

  it('son 7 dias, de lunes a domingo de la semana de hoy', () => {
    expect(semana).toHaveLength(7);
    expect(semana[0]!.etiqueta).toBe('Lunes');
    expect(semana[0]!.dia).toBe('2026-10-19');
    expect(semana[6]!.etiqueta).toBe('Domingo');
    expect(semana[6]!.dia).toBe('2026-10-25');
  });
  it('cada dia se compara con el mismo dia de la semana anterior', () => {
    expect(semana[2]).toMatchObject({ etiqueta: 'Miércoles', actual: 50, anterior: 30 });
    expect(semana[0]).toMatchObject({ actual: 0, anterior: 9 });
  });
  it('un dia sin ventas, o que todavia no llego, queda en cero', () => {
    expect(semana[6]).toMatchObject({ actual: 0, anterior: 0 });
    expect(semanaContraSemana([], HOY).every((d) => d.actual === 0 && d.anterior === 0)).toBe(true);
  });
});

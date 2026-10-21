import { describe, expect, it } from 'vitest';
import { semanaContraSemana, ultimosCatorceDias } from './semana';

// 2026-10-21 es miercoles: la semana va del jueves 15 al miercoles 21, contra el jueves 8 al 14.
const HOY = '2026-10-21';
// El grafico cuenta ventas, no plata: el monto no importa.
const venta = (dia: string, ventas: number) => ({ dia, ventas, monto_centavos: 0 });

describe('ultimosCatorceDias', () => {
  it('va de hace 13 dias a hoy, cruzando el mes', () =>
    expect(ultimosCatorceDias('2026-10-05')).toEqual({ desde: '2026-09-22', hasta: '2026-10-05' }));
});

describe('semanaContraSemana', () => {
  const ventas = [venta('2026-10-21', 50), venta('2026-10-14', 30), venta('2026-10-15', 9)];
  const semana = semanaContraSemana(ventas, HOY);

  it('son 7 dias, del mas viejo a hoy', () => {
    expect(semana).toHaveLength(7);
    expect(semana[0]!.dia).toBe('2026-10-15');
    expect(semana[6]!.dia).toBe('2026-10-21');
  });
  it('cada dia lleva el nombre del dia de la semana y el numero', () => {
    expect(semana[0]!.etiqueta).toBe('jue 15');
    expect(semana[6]!.etiqueta).toBe('mié 21');
  });
  it('cada dia se compara con el mismo dia de la semana anterior', () => {
    expect(semana[6]).toMatchObject({ actual: 50, anterior: 30 });
    expect(semana[0]).toMatchObject({ actual: 9, anterior: 0 });
    expect(semana[5]).toMatchObject({ dia: '2026-10-20', actual: 0, anterior: 0 });
  });
  it('un dia sin ventas queda en cero en las dos semanas', () => {
    const vacia = semanaContraSemana([], HOY);
    expect(vacia.every((d) => d.actual === 0 && d.anterior === 0)).toBe(true);
  });
  it('el dia de hace 7 se muestra como la semana anterior del dia de hoy', () => {
    const conAnterior = semanaContraSemana([venta('2026-10-14', 30)], HOY);
    expect(conAnterior[6]).toMatchObject({ dia: '2026-10-21', anterior: 30 });
  });
});

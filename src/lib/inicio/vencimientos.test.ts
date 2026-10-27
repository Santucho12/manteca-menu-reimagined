import { describe, expect, it } from 'vitest';
import type { FilaDeRecurrente } from '../gastos/consultas';
import { vencimientosDeLaSemana } from './vencimientos';

const HOY = '2026-10-21';
const recurrente = (
  id: string,
  primer_vencimiento: string,
  extra: Partial<FilaDeRecurrente> = {},
): FilaDeRecurrente => ({
  id,
  descripcion: `Gasto ${id}`,
  monto_centavos: 1_000,
  frecuencia: 'mensual',
  primer_vencimiento,
  activo: true,
  categoria: 'Servicios',
  proveedor: null,
  ...extra,
});

describe('vencimientosDeLaSemana', () => {
  it('entra lo que vence de hoy a 6 dias, ordenado por fecha', () => {
    const lista = [
      recurrente('a', '2026-01-27'),
      recurrente('b', '2026-01-21'),
      recurrente('c', '2026-01-28'),
    ];
    const { items } = vencimientosDeLaSemana(lista, HOY);
    expect(items.map((v) => [v.id, v.fecha])).toEqual([
      ['b', '2026-10-21'],
      ['a', '2026-10-27'],
    ]);
  });
  it('suma el total de lo que vence', () => {
    const lista = [
      recurrente('a', '2026-10-22', { monto_centavos: 1_500 }),
      recurrente('b', '2026-10-23', { monto_centavos: 2_000 }),
    ];
    expect(vencimientosDeLaSemana(lista, HOY).totalCentavos).toBe(3_500);
  });
  it('un recurrente desactivado no entra', () =>
    expect(
      vencimientosDeLaSemana([recurrente('a', '2026-10-22', { activo: false })], HOY).items,
    ).toEqual([]));
  it('un anual que vence el año que viene no entra', () =>
    expect(
      vencimientosDeLaSemana([recurrente('a', '2025-10-30', { frecuencia: 'anual' })], HOY).items,
    ).toEqual([]));
  it('el 31 pasa al ultimo dia del mes, como en la base', () =>
    expect(
      vencimientosDeLaSemana([recurrente('a', '2026-01-31')], '2026-11-26').items[0]!.fecha,
    ).toBe('2026-11-30'));
  it('sin vencimientos, la lista queda vacia y el total en cero', () =>
    expect(vencimientosDeLaSemana([], HOY)).toEqual({ items: [], totalCentavos: 0 }));
});

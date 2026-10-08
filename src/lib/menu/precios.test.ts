import { describe, expect, it } from 'vitest';
import { preciosVigentes, tienePrecio, type PrecioGuardado } from './precios';

const PRESENTACIONES = [
  { id: 'docena', nombre: 'Docena' },
  { id: 'unidad', nombre: 'Unidad' },
];

function precio(
  presentacionId: string,
  productoId: string | null,
  montoCentavos: number,
): PrecioGuardado {
  return { presentacionId, productoId, montoCentavos };
}

describe('preciosVigentes', () => {
  it('sin precio propio usa el compartido de la categoria', () => {
    const vigentes = preciosVigentes('medialuna', PRESENTACIONES, [
      precio('docena', null, 2000000),
    ]);
    expect(vigentes[0]).toEqual({
      presentacionId: 'docena',
      presentacion: 'Docena',
      montoCentavos: 2000000,
      origen: 'compartido',
    });
    expect(vigentes[1]).toEqual({
      presentacionId: 'unidad',
      presentacion: 'Unidad',
      montoCentavos: null,
      origen: null,
    });
  });

  it('el propio le gana al compartido, presentacion por presentacion', () => {
    const vigentes = preciosVigentes('medialuna', PRESENTACIONES, [
      precio('docena', null, 2000000),
      precio('unidad', null, 300000),
      precio('unidad', 'medialuna', 350000),
    ]);
    expect(vigentes.map((v) => [v.montoCentavos, v.origen])).toEqual([
      [2000000, 'compartido'],
      [350000, 'propio'],
    ]);
  });

  it('no toma el precio propio de otro producto', () => {
    const vigentes = preciosVigentes('medialuna', PRESENTACIONES, [
      precio('unidad', 'flor', 350000),
    ]);
    expect(tienePrecio(vigentes)).toBe(false);
  });
});

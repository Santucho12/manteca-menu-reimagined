import { describe, expect, it } from 'vitest';
import { recetasPorInsumo, usosDelInsumo } from './usos';

const renglon = (insumo: string, receta: string, cambios = {}) => ({
  insumo_id: insumo,
  recetas: {
    id: receta,
    activo: true,
    producto_id: 'p1',
    productos: { nombre: 'Medialuna' },
    presentaciones: null,
    ...cambios,
  },
});

describe('recetasPorInsumo', () => {
  it('cuenta en cuantas recetas activas esta cada insumo', () => {
    const conteo = recetasPorInsumo([
      renglon('harina', 'r1'),
      renglon('harina', 'r2'),
      renglon('manteca', 'r1'),
      renglon('harina', 'r3', { activo: false }),
    ]);
    expect(conteo.get('harina')).toBe(2);
    expect(conteo.get('manteca')).toBe(1);
    expect(conteo.get('azucar')).toBeUndefined();
  });
});

describe('usosDelInsumo', () => {
  it('los productos cuya receta lo usa, con la presentacion si es su receta propia', () => {
    expect(
      usosDelInsumo([
        renglon('harina', 'r1'),
        renglon('harina', 'r2', { presentaciones: { nombre: 'Docena' } }),
        renglon('harina', 'r3', { activo: false }),
      ]),
    ).toEqual([
      { recetaId: 'r1', productoId: 'p1', producto: 'Medialuna', presentacion: null },
      { recetaId: 'r2', productoId: 'p1', producto: 'Medialuna', presentacion: 'Docena' },
    ]);
  });
});

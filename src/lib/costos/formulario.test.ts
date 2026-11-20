import { describe, expect, it } from 'vitest';
import type { RecetaDelProducto } from './consultas';
import { datosDeLaReceta, insumosDeLaReceta } from './formulario';

const renglon = (insumoId: string, cantidad: number) => ({
  insumoId,
  nombre: 'Harina',
  unidad: 'g' as const,
  cantidad,
  costoPorUnidad: 1,
  aporte: cantidad,
  activoElInsumo: true,
});
const receta = (cambios: Partial<RecetaDelProducto> = {}): RecetaDelProducto => ({
  producto: { productoId: 'p1', producto: 'Medialuna', categoria: 'Facturas', presentaciones: [] },
  base: { id: 'r1', rinde: 40, desperdicio: 5.5, renglones: [renglon('i1', 1500)] },
  presentaciones: [
    { id: 'u', nombre: 'Unidad', propia: null },
    {
      id: 'd',
      nombre: 'Docena',
      propia: { id: 'r2', rinde: 1, desperdicio: 0, renglones: [renglon('i2', 2)] },
    },
  ],
  ...cambios,
});

describe('datosDeLaReceta', () => {
  it('la del producto, con los numeros como se escriben', () => {
    expect(datosDeLaReceta(receta(), '')).toEqual({
      productoId: 'p1',
      presentacionId: '',
      rinde: '40',
      desperdicio: '5,5',
      renglones: [{ insumoId: 'i1', cantidad: '1.500' }],
    });
  });

  it('la propia de una presentacion', () => {
    expect(datosDeLaReceta(receta(), 'd')).toMatchObject({
      presentacionId: 'd',
      renglones: [{ insumoId: 'i2', cantidad: '2' }],
    });
  });

  it('una presentacion sin receta propia arranca de la del producto', () => {
    expect(datosDeLaReceta(receta(), 'u')).toMatchObject({
      presentacionId: 'u',
      rinde: '1',
      renglones: [{ insumoId: 'i1', cantidad: '1.500' }],
    });
  });

  it('sin receta arranca vacia, y una presentacion que no es suya se ignora', () => {
    expect(datosDeLaReceta(receta({ base: null }), 'otra')).toEqual({
      productoId: 'p1',
      presentacionId: '',
      rinde: '1',
      desperdicio: '0',
      renglones: [],
    });
  });
});

describe('insumosDeLaReceta', () => {
  const activos = [{ id: 'i1', nombre: 'Harina', unidad: 'g' as const }];

  it('suma los desactivados que ya estan en la receta, marcados', () => {
    const conApagado = receta({
      base: {
        id: 'r1',
        rinde: 1,
        desperdicio: 0,
        renglones: [{ ...renglon('i9', 2), nombre: 'Leche', activoElInsumo: false }],
      },
    });
    expect(insumosDeLaReceta(activos, conApagado)).toEqual({
      insumos: [...activos, { id: 'i9', nombre: 'Leche (desactivado)', unidad: 'g' }],
      desactivados: ['i9'],
    });
  });

  it('sin desactivados, los activos tal cual', () => {
    expect(insumosDeLaReceta(activos, receta())).toEqual({ insumos: activos, desactivados: [] });
  });
});

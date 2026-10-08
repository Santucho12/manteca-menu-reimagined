import { describe, expect, it } from 'vitest';
import {
  alcanceDelAumento,
  armarPanel,
  categoriaParaEditar,
  desactivados,
  productoParaEditar,
  type FilasDelMenu,
} from './panel';

const ID = {
  facturas: '00000000-0000-4000-8000-000000000001',
  panes: '00000000-0000-4000-8000-000000000002',
  docena: '00000000-0000-4000-8000-000000000011',
  unidad: '00000000-0000-4000-8000-000000000012',
  vieja: '00000000-0000-4000-8000-000000000013',
  panUnidad: '00000000-0000-4000-8000-000000000014',
  medialuna: '00000000-0000-4000-8000-000000000021',
  flor: '00000000-0000-4000-8000-000000000022',
  baja: '00000000-0000-4000-8000-000000000023',
};

function filas(): FilasDelMenu {
  const categoria = { subtitulo: null, foto: null, icono: '🥐', visible: true, activo: true };
  const producto = { descripcion: null, etiqueta: null, visible: true, activo: true };
  return {
    categorias: [
      { ...categoria, id: ID.panes, nombre: 'Panes', orden: 1, activo: false },
      { ...categoria, id: ID.facturas, nombre: 'Facturas', orden: 0 },
    ],
    presentaciones: [
      { id: ID.unidad, categoria_id: ID.facturas, nombre: 'Unidad', orden: 1, activo: true },
      { id: ID.docena, categoria_id: ID.facturas, nombre: 'Docena', orden: 0, activo: true },
      { id: ID.vieja, categoria_id: ID.facturas, nombre: 'Media', orden: 2, activo: false },
      { id: ID.panUnidad, categoria_id: ID.panes, nombre: 'Unidad', orden: 0, activo: true },
    ],
    productos: [
      {
        ...producto,
        id: ID.flor,
        categoria_id: ID.facturas,
        nombre: 'Flor',
        orden: 1,
        visible: false,
      },
      { ...producto, id: ID.medialuna, categoria_id: ID.facturas, nombre: 'Medialuna', orden: 0 },
      {
        ...producto,
        id: ID.baja,
        categoria_id: ID.facturas,
        nombre: 'Baja',
        orden: 2,
        activo: false,
      },
    ],
    precios: [
      {
        id: 'p1',
        presentacion_id: ID.docena,
        producto_id: null,
        monto_centavos: 2000000,
        activo: true,
      },
      {
        id: 'p2',
        presentacion_id: ID.unidad,
        producto_id: ID.flor,
        monto_centavos: 350000,
        activo: true,
      },
      {
        id: 'p3',
        presentacion_id: ID.unidad,
        producto_id: ID.baja,
        monto_centavos: 100000,
        activo: true,
      },
      {
        id: 'p4',
        presentacion_id: ID.vieja,
        producto_id: null,
        monto_centavos: 900000,
        activo: true,
      },
      {
        id: 'p5',
        presentacion_id: ID.unidad,
        producto_id: ID.medialuna,
        monto_centavos: 300000,
        activo: false,
      },
    ],
  };
}

describe('armarPanel', () => {
  it('trae lo activo, en orden, con los precios vigentes y su origen', () => {
    const [facturas, ...resto] = armarPanel(filas());
    expect(resto).toEqual([]);
    expect(facturas.presentaciones.map((p) => p.nombre)).toEqual(['Docena', 'Unidad']);
    expect(facturas.compartidos).toEqual([2000000, null]);
    expect(facturas.productos.map((p) => p.nombre)).toEqual(['Medialuna', 'Flor']);
    const [medialuna, flor] = facturas.productos;
    expect(medialuna.precios.map((p) => [p.montoCentavos, p.origen])).toEqual([
      [2000000, 'compartido'],
      [null, null],
    ]);
    expect(flor.precios.map((p) => p.origen)).toEqual(['compartido', 'propio']);
    expect(flor.visible).toBe(false);
  });
});

describe('alcanceDelAumento', () => {
  it('trae compartidos y propios de lo activo, ocultos incluidos', () => {
    const alcance = alcanceDelAumento(filas(), ID.facturas);
    expect(alcance.map((p) => [p.id, p.producto, p.oculto])).toEqual([
      ['p1', null, false],
      ['p2', 'Flor', true],
    ]);
  });

  it('todo el menu deja afuera las categorias desactivadas', () => {
    expect(alcanceDelAumento(filas(), null).map((p) => p.id)).toEqual(['p1', 'p2']);
  });
});

describe('desactivados', () => {
  it('lista categorias y productos desactivados, con el estado de su categoria', () => {
    expect(desactivados(filas())).toEqual({
      categorias: [{ id: ID.panes, nombre: 'Panes' }],
      productos: [{ id: ID.baja, nombre: 'Baja', categoria: 'Facturas', categoriaActiva: true }],
    });
  });
});

describe('datos para editar', () => {
  it('arma el formulario de una categoria con sus presentaciones y compartidos en pesos', () => {
    const panel = armarPanel(filas());
    expect(categoriaParaEditar(panel, ID.facturas)).toMatchObject({
      nombre: 'Facturas',
      precioCompartido: true,
      presentaciones: [
        { id: ID.docena, nombre: 'Docena', compartido: '20000' },
        { id: ID.unidad, nombre: 'Unidad', compartido: '' },
      ],
    });
  });

  it('arma el formulario de un producto con solo sus precios propios', () => {
    const panel = armarPanel(filas());
    expect(productoParaEditar(panel, ID.flor)).toMatchObject({
      categoriaId: ID.facturas,
      visible: false,
      precios: [
        { presentacionId: ID.docena, monto: '' },
        { presentacionId: ID.unidad, monto: '3500' },
      ],
    });
    expect(productoParaEditar(panel, 'otro')).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import {
  aCentavos,
  categoriaParaLaBase,
  esquemaAumento,
  esquemaCategoria,
  esquemaProducto,
  productoParaLaBase,
  type DatosDeCategoria,
} from './esquemas';

const CATEGORIA: DatosDeCategoria = {
  id: '',
  nombre: 'Facturas',
  subtitulo: '',
  icono: '🥐',
  foto: '',
  precioCompartido: true,
  presentaciones: [
    { id: '', nombre: 'Docena', compartido: '20000', compartidoOriginal: '' },
    { id: '', nombre: 'Unidad', compartido: '', compartidoOriginal: '' },
  ],
};

describe('esquemas del menu', () => {
  it('acepta una categoria con presentaciones y precio compartido', () => {
    expect(esquemaCategoria.safeParse(CATEGORIA).success).toBe(true);
  });

  it('pide nombre y al menos una presentacion', () => {
    const sinNada = esquemaCategoria.safeParse({ ...CATEGORIA, nombre: ' ', presentaciones: [] });
    expect(sinNada.error?.issues.map((i) => i.message)).toEqual([
      'Escribí el nombre.',
      'Tiene que tener al menos una presentación.',
    ]);
  });

  it.each(['1.500', '1500,50', '-3', '0'])('rechaza el precio %s', (texto) => {
    const datos = {
      ...CATEGORIA,
      presentaciones: [{ id: '', nombre: 'Unidad', compartido: texto, compartidoOriginal: '' }],
    };
    expect(esquemaCategoria.safeParse(datos).success).toBe(false);
  });

  it('el porcentaje va de -50 a 200 y no puede ser 0', () => {
    const base = { categoriaId: '', redondeo: '10000' };
    expect(esquemaAumento.safeParse({ ...base, porcentaje: '-50' }).success).toBe(true);
    expect(esquemaAumento.safeParse({ ...base, porcentaje: '201' }).success).toBe(false);
    expect(esquemaAumento.safeParse({ ...base, porcentaje: '0' }).success).toBe(false);
    expect(esquemaAumento.safeParse({ ...base, porcentaje: '7.5' }).success).toBe(false);
  });

  it('pide elegir una categoria para el producto', () => {
    const producto = {
      id: '',
      categoriaId: '',
      nombre: 'Flor',
      descripcion: '',
      etiqueta: '',
      visible: true,
      precios: [],
    };
    expect(esquemaProducto.safeParse(producto).error?.issues[0]?.message).toBe(
      'Elegí una categoría.',
    );
  });
});

const ID = '3f0c1d2e-4b5a-4c6d-8e7f-9a0b1c2d3e4f';
const OTRO = '4a1b2c3d-5e6f-4a7b-8c9d-0e1f2a3b4c5d';

describe('conversion a lo que recibe la base', () => {
  it('pasa pesos a centavos y vacio a sin precio', () => {
    expect(aCentavos('4000')).toBe(400000);
    expect(aCentavos(' ')).toBeNull();
  });

  it('una categoria nueva va sin ids y manda solo los compartidos que cambiaron', () => {
    expect(categoriaParaLaBase(CATEGORIA)).toEqual({
      id: null,
      nombre: 'Facturas',
      subtitulo: null,
      icono: '🥐',
      foto: null,
      presentaciones: [
        { id: null, nombre: 'Docena', monto_compartido_centavos: 2000000 },
        { id: null, nombre: 'Unidad' },
      ],
    });
  });

  it('no manda un compartido que no se toco: asi no pisa un aumento hecho en el medio', () => {
    const presentaciones = [
      { id: ID, nombre: 'Docena', compartido: '20000', compartidoOriginal: '20000' },
    ];
    const base = categoriaParaLaBase({ ...CATEGORIA, presentaciones });
    expect(base.presentaciones).toEqual([{ id: ID, nombre: 'Docena' }]);
  });

  it('sacar la casilla de precio compartido saca los que habia', () => {
    const presentaciones = [
      { id: ID, nombre: 'Docena', compartido: '20000', compartidoOriginal: '20000' },
    ];
    const base = categoriaParaLaBase({ ...CATEGORIA, precioCompartido: false, presentaciones });
    expect(base.presentaciones).toEqual([
      { id: ID, nombre: 'Docena', monto_compartido_centavos: null },
    ]);
  });

  it('un producto manda solo los precios que cambiaron', () => {
    const producto = {
      id: '',
      categoriaId: ID,
      nombre: 'Flor',
      descripcion: '',
      etiqueta: '' as const,
      visible: true,
      precios: [
        { presentacionId: ID, monto: '3500', original: '' },
        { presentacionId: OTRO, monto: '1000', original: '1000' },
      ],
    };
    expect(productoParaLaBase(producto)).toEqual({
      id: null,
      categoria_id: ID,
      nombre: 'Flor',
      descripcion: null,
      etiqueta: null,
      visible: true,
      precios: [{ presentacion_id: ID, monto_centavos: 350000 }],
    });
  });
});

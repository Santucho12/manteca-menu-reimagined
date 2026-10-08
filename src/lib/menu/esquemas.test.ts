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
    { id: '', nombre: 'Docena', compartido: '20000' },
    { id: '', nombre: 'Unidad', compartido: '' },
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
      presentaciones: [{ id: '', nombre: 'Unidad', compartido: texto }],
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

describe('conversion a lo que recibe la base', () => {
  it('pasa pesos a centavos y vacio a sin precio', () => {
    expect(aCentavos('4000')).toBe(400000);
    expect(aCentavos(' ')).toBeNull();
  });

  it('una categoria nueva va sin ids y con los compartidos en centavos', () => {
    expect(categoriaParaLaBase(CATEGORIA)).toEqual({
      id: null,
      nombre: 'Facturas',
      subtitulo: null,
      icono: '🥐',
      foto: null,
      presentaciones: [
        { id: null, nombre: 'Docena', monto_compartido_centavos: 2000000 },
        { id: null, nombre: 'Unidad', monto_compartido_centavos: null },
      ],
    });
  });

  it('sin la casilla de precio compartido no manda compartidos', () => {
    const base = categoriaParaLaBase({ ...CATEGORIA, precioCompartido: false });
    expect(base.presentaciones.map((p) => p.monto_compartido_centavos)).toEqual([null, null]);
  });

  it('un producto manda sus precios por presentacion', () => {
    const id = '3f0c1d2e-4b5a-4c6d-8e7f-9a0b1c2d3e4f';
    const producto = {
      id: '',
      categoriaId: id,
      nombre: 'Flor',
      descripcion: '',
      etiqueta: '' as const,
      visible: true,
      precios: [{ presentacionId: id, monto: '3500' }],
    };
    expect(productoParaLaBase(producto)).toEqual({
      id: null,
      categoria_id: id,
      nombre: 'Flor',
      descripcion: null,
      etiqueta: null,
      visible: true,
      precios: [{ presentacion_id: id, monto_centavos: 350000 }],
    });
  });
});

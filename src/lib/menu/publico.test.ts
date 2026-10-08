import { describe, expect, it } from 'vitest';
import { menuPublico, type FilaPublica } from './publico';

function fila(cambios: Partial<FilaPublica>): FilaPublica {
  return {
    categoria_id: 'c1',
    categoria: 'Laminados',
    subtitulo: 'Por unidad',
    foto: '/menu/laminados.jpeg',
    icono: '🧈',
    orden_categoria: 1,
    compartidos: [],
    producto_id: 'p1',
    nombre: 'Croissant',
    descripcion: 'Hojaldre',
    etiqueta: null,
    orden: 0,
    precios: [{ presentacion: 'Unidad', monto_centavos: 500000, compartido: false }],
    ...cambios,
  };
}

const FACTURAS = {
  categoria_id: 'c0',
  categoria: 'Facturas',
  subtitulo: null,
  icono: '🥐',
  orden_categoria: 0,
  compartidos: [
    { presentacion: 'Docena', monto_centavos: 2000000 },
    { presentacion: 'Unidad', monto_centavos: 300000 },
  ],
};

describe('menuPublico', () => {
  it('una presentacion sola: el precio sin etiqueta y dos columnas', () => {
    const [categoria] = menuPublico([fila({})]);
    expect(categoria).toMatchObject({
      nombre: 'Laminados',
      subtitulo: 'Por unidad',
      columnas: 2,
      encabezados: null,
    });
    expect(categoria.productos[0].precios).toEqual([{ etiqueta: null, texto: '$5.000' }]);
  });

  it('con precio compartido el subtitulo lleva los precios y el producto no repite el heredado', () => {
    const precios = [
      { presentacion: 'Docena', monto_centavos: 2000000, compartido: true },
      { presentacion: 'Unidad', monto_centavos: 350000, compartido: false },
    ];
    const [categoria] = menuPublico([fila({ ...FACTURAS, precios })]);
    expect(categoria.subtitulo).toBe('Docena $20.000 · Unidad $3.000');
    expect(categoria.columnas).toBe(2);
    expect(categoria.productos[0].precios).toEqual([{ etiqueta: 'Unidad', texto: '$3.500' }]);
  });

  it('el subtitulo con compartidos suma el texto de la categoria', () => {
    const [categoria] = menuPublico([fila({ ...FACTURAS, subtitulo: 'Hechas hoy' })]);
    expect(categoria.subtitulo).toBe('Docena $20.000 · Unidad $3.000 · Hechas hoy');
  });

  it('varias presentaciones sin compartido: una columna por presentacion y guion donde falta', () => {
    const precios = [
      { presentacion: 'Mediano', monto_centavos: null, compartido: true },
      { presentacion: 'Grande', monto_centavos: 610000, compartido: false },
    ];
    const [categoria] = menuPublico([fila({ precios })]);
    expect(categoria).toMatchObject({ columnas: 1, encabezados: ['Mediano', 'Grande'] });
    expect(categoria.productos[0].precios).toEqual([
      { etiqueta: 'Mediano', texto: '—' },
      { etiqueta: 'Grande', texto: '$6.100' },
    ]);
  });

  it('ordena categorias y productos, y arma anclas unicas', () => {
    const categorias = menuPublico([
      fila({ producto_id: 'p2', nombre: 'Danesa', orden: 1 }),
      fila({ ...FACTURAS, producto_id: 'p3', nombre: 'Medialuna', precios: [] }),
      fila({}),
    ]);
    expect(categorias.map((c) => c.ancla)).toEqual(['facturas', 'laminados']);
    expect(categorias[1].productos.map((p) => p.nombre)).toEqual(['Croissant', 'Danesa']);
  });

  it('la etiqueta se ve con su texto', () => {
    const [categoria] = menuPublico([fila({ etiqueta: 'mas_vendido' })]);
    expect(categoria.productos[0].etiqueta).toBe('🔥 Más vendido');
  });

  it('sin filas no hay menu', () => {
    expect(menuPublico([])).toEqual([]);
  });
});

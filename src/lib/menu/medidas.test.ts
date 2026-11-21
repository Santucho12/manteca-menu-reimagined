import { describe, expect, it } from 'vitest';
import { categoriaParaLaBase, esquemaCategoria, type DatosDeCategoria } from './esquemas';

// Cada forma de venta dice cuánto es: unidades (Docena = 12) o gramos (Por cuarto = 250).
// Con eso Vender junta la docena variada y cobra por peso (Santiago, 2026-11-20, pedido 102).
const forma = (medida: '' | 'unidades' | 'gramos', cantidad: string) => ({
  id: '',
  nombre: 'Docena',
  compartido: '',
  compartidoOriginal: '',
  medida,
  cantidad,
});

const categoria = (p: DatosDeCategoria['presentaciones'][number]): DatosDeCategoria => ({
  id: '',
  nombre: 'Facturas',
  subtitulo: '',
  icono: '🥐',
  foto: '',
  precioCompartido: false,
  presentaciones: [p],
});

describe('la medida de una forma de venta', () => {
  it('manda las unidades o los gramos, y la otra en nulo', () => {
    expect(categoriaParaLaBase(categoria(forma('unidades', '12'))).presentaciones[0]).toMatchObject(
      {
        unidades: 12,
        gramos: null,
      },
    );
    expect(categoriaParaLaBase(categoria(forma('gramos', '250'))).presentaciones[0]).toMatchObject({
      unidades: null,
      gramos: 250,
    });
  });

  it('sin medida, las dos van en nulo', () => {
    expect(categoriaParaLaBase(categoria(forma('', ''))).presentaciones[0]).toMatchObject({
      unidades: null,
      gramos: null,
    });
  });

  it('con medida elegida pide un número entero mayor que cero', () => {
    expect(esquemaCategoria.safeParse(categoria(forma('unidades', '0'))).success).toBe(false);
    expect(esquemaCategoria.safeParse(categoria(forma('gramos', '2,5'))).success).toBe(false);
    expect(esquemaCategoria.safeParse(categoria(forma('gramos', ''))).success).toBe(false);
    expect(esquemaCategoria.safeParse(categoria(forma('gramos', '250'))).success).toBe(true);
  });
});

describe('la medida al abrir una categoría', () => {
  it('trae las unidades o los gramos guardados para editarlos', async () => {
    const { armarPanel, categoriaParaEditar } = await import('./panel');
    const categoria = { subtitulo: null, foto: null, icono: '🥐', visible: true, activo: true };
    const panel = armarPanel({
      categorias: [{ ...categoria, id: 'c', nombre: 'Facturas', orden: 0 }],
      presentaciones: [
        { id: 'd', categoria_id: 'c', nombre: 'Docena', orden: 0, activo: true, unidades: 12 },
        { id: 'p', categoria_id: 'c', nombre: 'Cuarto', orden: 1, activo: true, gramos: 250 },
        { id: 'o', categoria_id: 'c', nombre: 'Otra', orden: 2, activo: true },
      ],
      productos: [],
      precios: [],
    });
    expect(categoriaParaEditar(panel, 'c')?.presentaciones).toMatchObject([
      { nombre: 'Docena', medida: 'unidades', cantidad: '12' },
      { nombre: 'Cuarto', medida: 'gramos', cantidad: '250' },
      { nombre: 'Otra', medida: '', cantidad: '' },
    ]);
  });
});

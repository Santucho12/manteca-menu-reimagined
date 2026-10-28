import { describe, expect, it } from 'vitest';
import { agruparPorCategoria } from './porCategoria';

const gasto = (
  categoria_id: string,
  categoria: string,
  monto_centavos: number,
  fecha = '2026-10-05',
  descripcion: string | null = null,
) => ({
  id: `${categoria_id}-${monto_centavos}`,
  categoria_id,
  categoria,
  monto_centavos,
  fecha,
  descripcion,
});

describe('agruparPorCategoria', () => {
  it('cuenta y suma los gastos de cada categoria, la que mas suma primero', () => {
    const resumen = agruparPorCategoria([
      gasto('a', 'Alquiler', 100000),
      gasto('m', 'Mercadería', 30000),
      gasto('m', 'Mercadería', 45050),
      gasto('a', 'Alquiler', 20000),
      gasto('g', 'Gas', 5000),
    ]);
    expect(
      resumen.map((r) => ({
        categoriaId: r.categoriaId,
        nombre: r.nombre,
        cantidad: r.cantidad,
        totalCentavos: r.totalCentavos,
      })),
    ).toEqual([
      { categoriaId: 'a', nombre: 'Alquiler', cantidad: 2, totalCentavos: 120000 },
      { categoriaId: 'm', nombre: 'Mercadería', cantidad: 2, totalCentavos: 75050 },
      { categoriaId: 'g', nombre: 'Gas', cantidad: 1, totalCentavos: 5000 },
    ]);
  });

  it('lista los gastos de cada categoria, el mas reciente primero', () => {
    const [mercaderia] = agruparPorCategoria([
      gasto('m', 'Mercadería', 100, '2026-10-02', 'Huevos'),
      gasto('m', 'Mercadería', 200, '2026-10-20', 'Leche'),
      gasto('m', 'Mercadería', 300, '2026-10-11', null),
    ]);
    expect(mercaderia!.gastos).toEqual([
      { id: 'm-200', fecha: '2026-10-20', descripcion: 'Leche', montoCentavos: 200 },
      { id: 'm-300', fecha: '2026-10-11', descripcion: null, montoCentavos: 300 },
      { id: 'm-100', fecha: '2026-10-02', descripcion: 'Huevos', montoCentavos: 100 },
    ]);
  });

  it('con igual total ordena por nombre, y sin gastos no hay tarjetas', () => {
    const resumen = agruparPorCategoria([gasto('b', 'Bebidas', 100), gasto('a', 'Alquiler', 100)]);
    expect(resumen.map((r) => r.nombre)).toEqual(['Alquiler', 'Bebidas']);
    expect(agruparPorCategoria([])).toEqual([]);
  });
});

import { afterAll, describe, expect, it } from 'vitest';
import { resumenPorCategoria } from '../../src/lib/gastos/resumenPorCategoria';
import {
  borrarCategoriasConSusGastos,
  sembrarCategoriaDeGasto,
  sembrarGasto,
} from '../gastos-de-prueba';
import { clienteComo } from '../sesiones';

const categorias: string[] = [];
afterAll(() => borrarCategoriasConSusGastos(categorias));

const MARZO = { desde: '2019-03-01', hasta: '2019-03-31', tipo: null } as const;

async function categoria() {
  const sembrada = await sembrarCategoriaDeGasto();
  categorias.push(sembrada.id);
  return sembrada;
}

describe('resumenPorCategoria', () => {
  it('cuenta y suma por categoria los gastos del rango, sin los anulados', async () => {
    const a = await categoria();
    const b = await categoria();
    const gasto = (c: { id: string }, centavos: number, extra = {}) =>
      sembrarGasto({ categoriaId: c.id, fecha: '2019-03-10', montoCentavos: centavos, ...extra });
    await gasto(a, 100000);
    await gasto(a, 50000);
    await gasto(a, 999999, { anulado: true });
    await gasto(b, 7000);
    await sembrarGasto({ categoriaId: b.id, fecha: '2019-04-01', montoCentavos: 1 });
    const resumen = await resumenPorCategoria(await clienteComo('admin'), MARZO);
    expect(resumen.filter((r) => [a.id, b.id].includes(r.categoriaId))).toMatchObject([
      { categoriaId: a.id, nombre: a.nombre, cantidad: 2, totalCentavos: 150000 },
      { categoriaId: b.id, nombre: b.nombre, cantidad: 1, totalCentavos: 7000 },
    ]);
  });
});

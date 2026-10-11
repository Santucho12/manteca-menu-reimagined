import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  borrarCategoriasConSusGastos,
  sembrarCategoriaDeGasto,
  sembrarGasto,
} from '../gastos-de-prueba';
import { sembrarVentaConRenglones, type SemillaConRenglones } from '../reportes-de-prueba';
import { clienteComo } from '../sesiones';
import { borrarVentas, productoParaVender, type ParaVender } from '../ventas-de-prueba';

// Un periodo propio, febrero de 2018, para no cruzarse con lo que siembran otros tests.
const PERIODO = { desde: '2018-02-01', hasta: '2018-02-28' };
let a: ParaVender;
let b: ParaVender;
let ventas: string[] = [];
let categorias: { id: string; nombre: string }[] = [];

const vender = (
  fecha: string,
  renglones: SemillaConRenglones['renglones'],
  extra: Partial<SemillaConRenglones> = {},
) => sembrarVentaConRenglones({ fecha, renglones, ...extra });

async function sembrarVentas() {
  const unoDeA = (cantidad: number) => [{ producto: a, cantidad, precioCentavos: 150000 }];
  ventas = await Promise.all([
    vender('2018-02-03', [
      { producto: a, cantidad: 2, precioCentavos: 150000 },
      { producto: b, cantidad: 1, precioCentavos: 50000 },
    ]),
    vender('2018-02-03', unoDeA(1)),
    vender('2018-02-04', unoDeA(5), { estado: 'cancelada' }),
    vender('2018-02-05', unoDeA(5), { anulado: true }),
    vender('2018-03-01', unoDeA(1)),
    vender('2018-02-10', [
      { producto: null, cantidad: 3, precioCentavos: 10000, descripcion: 'Medialuna Fudo' },
    ]),
  ]);
}

async function sembrarGastos() {
  categorias = await Promise.all([sembrarCategoriaDeGasto(), sembrarCategoriaDeGasto()]);
  const [g1, g2] = categorias.map((c) => c.id);
  await Promise.all([
    sembrarGasto({ categoriaId: g1, fecha: '2018-02-03', montoCentavos: 100000 }),
    sembrarGasto({ categoriaId: g1, fecha: '2018-02-03', montoCentavos: 50000 }),
    sembrarGasto({ categoriaId: g2, fecha: '2018-02-04', montoCentavos: 70000 }),
    sembrarGasto({ categoriaId: g1, fecha: '2018-02-04', montoCentavos: 999999, anulado: true }),
    sembrarGasto({ categoriaId: g2, fecha: '2018-03-01', montoCentavos: 70000 }),
  ]);
}

beforeAll(async () => {
  [a, b] = await Promise.all([productoParaVender(), productoParaVender()]);
  await Promise.all([sembrarVentas(), sembrarGastos()]);
});

afterAll(async () => {
  await borrarVentas(ventas, { categoriasDelMenu: [a.categoriaId, b.categoriaId] });
  await borrarCategoriasConSusGastos(categorias.map((c) => c.id));
});

async function leer(funcion: string) {
  const cliente = await clienteComo('admin');
  const { data, error } = await cliente.rpc(funcion as never, PERIODO as never);
  expect(error).toBeNull();
  return data as unknown as Record<string, unknown>[];
}

describe('reportes: ventas', () => {
  it('por dia cuenta solo lo cerrado y sin anular del periodo', async () => {
    expect(await leer('reporte_ventas_por_dia')).toEqual([
      { dia: '2018-02-03', ventas: 2, monto_centavos: 500000 },
      { dia: '2018-02-10', ventas: 1, monto_centavos: 30000 },
    ]);
  });

  it('por producto suma cantidad y monto, y deja lo no vinculado sin producto', async () => {
    const filas = await leer('reporte_ventas_por_producto');
    expect(filas).toHaveLength(3);
    expect(filas[0]).toMatchObject({
      producto_id: a.productoId,
      categoria_id: a.categoriaId,
      cantidad: 3,
      monto_centavos: 450000,
    });
    expect(filas).toContainEqual(
      expect.objectContaining({ producto_id: b.productoId, cantidad: 1, monto_centavos: 50000 }),
    );
    expect(filas).toContainEqual(
      expect.objectContaining({
        producto_id: null,
        producto: 'Medialuna Fudo',
        categoria_id: null,
        cantidad: 3,
        monto_centavos: 30000,
      }),
    );
  });

  it('por categoria cuenta ventas distintas y junta lo no vinculado', async () => {
    expect(await leer('reporte_ventas_por_categoria')).toEqual([
      expect.objectContaining({ categoria_id: a.categoriaId, ventas: 2, monto_centavos: 450000 }),
      expect.objectContaining({ categoria_id: b.categoriaId, ventas: 1, monto_centavos: 50000 }),
      { categoria_id: null, categoria: 'Sin vincular', ventas: 1, monto_centavos: 30000 },
    ]);
  });
});

describe('reportes: otro local', () => {
  it('el admin de otro local no ve las ventas ni los gastos de este', async () => {
    const otro = await clienteComo('adminOtroLocal');
    for (const funcion of ['reporte_ventas_por_dia', 'reporte_gastos'] as const) {
      const { data, error } = await otro.rpc(funcion as never, PERIODO as never);
      expect(error).toBeNull();
      expect(data, funcion).toEqual([]);
    }
  });
});

describe('reportes: gastos', () => {
  it('suma por dia y categoria, sin lo anulado ni lo de afuera del periodo', async () => {
    const [g1, g2] = categorias;
    expect(await leer('reporte_gastos')).toEqual([
      { dia: '2018-02-03', categoria_id: g1!.id, categoria: g1!.nombre, monto_centavos: 150000 },
      { dia: '2018-02-04', categoria_id: g2!.id, categoria: g2!.nombre, monto_centavos: 70000 },
    ]);
  });
});

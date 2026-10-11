import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  cierresDelPeriodo,
  gastosPorDia,
  ventasPorCategoria,
  ventasPorDia,
  ventasPorProducto,
} from '../../src/lib/reportes/consultas';
import { borrarCierres, sembrarCierre } from '../cierres-de-prueba';
import {
  borrarCategoriasConSusGastos,
  sembrarCategoriaDeGasto,
  sembrarGasto,
} from '../gastos-de-prueba';
import { sembrarVentaConRenglones } from '../reportes-de-prueba';
import { clienteComo } from '../sesiones';
import { borrarVentas, productoParaVender, type ParaVender } from '../ventas-de-prueba';

// Mayo de 2018: un periodo propio, que no siembra ningun otro test.
const PERIODO = { desde: '2018-05-01', hasta: '2018-05-31' };
let producto: ParaVender;
let venta: string;
let categoria: { id: string; nombre: string };
let cierre: { id: string };

beforeAll(async () => {
  producto = await productoParaVender();
  categoria = await sembrarCategoriaDeGasto();
  venta = await sembrarVentaConRenglones({
    fecha: '2018-05-10',
    renglones: [{ producto, cantidad: 2, precioCentavos: 100000 }],
  });
  await sembrarGasto({ categoriaId: categoria.id, fecha: '2018-05-11', montoCentavos: 40000 });
  cierre = await sembrarCierre({ fecha: '2018-05-12' });
});

afterAll(async () => {
  await borrarVentas([venta], { categoriasDelMenu: [producto.categoriaId] });
  await borrarCategoriasConSusGastos([categoria.id]);
  await borrarCierres([cierre.id]);
});

describe('consultas de los reportes', () => {
  it('lee las ventas por dia, producto y categoria con la sesion del admin', async () => {
    const admin = await clienteComo('admin');
    expect(await ventasPorDia(admin, PERIODO)).toEqual([
      { dia: '2018-05-10', ventas: 1, monto_centavos: 200000 },
    ]);
    expect(await ventasPorProducto(admin, PERIODO)).toEqual([
      expect.objectContaining({
        producto_id: producto.productoId,
        cantidad: 2,
        monto_centavos: 200000,
      }),
    ]);
    expect(await ventasPorCategoria(admin, PERIODO)).toEqual([
      expect.objectContaining({ categoria_id: producto.categoriaId, ventas: 1 }),
    ]);
  });

  it('lee los gastos del periodo', async () => {
    expect(await gastosPorDia(await clienteComo('admin'), PERIODO)).toEqual([
      {
        dia: '2018-05-11',
        categoria_id: categoria.id,
        categoria: categoria.nombre,
        monto_centavos: 40000,
      },
    ]);
  });

  it('lee los cierres con quien los cargo, lo declarado y sin diferencia mientras esperan', async () => {
    expect(await cierresDelPeriodo(await clienteComo('admin'), PERIODO)).toEqual([
      {
        fecha: '2018-05-12',
        persona: 'Prueba Caja',
        declaradoCentavos: 2000000,
        diferenciaCentavos: null,
      },
    ]);
  });

  it('a caja le avisa que no puede', async () => {
    await expect(ventasPorDia(await clienteComo('caja'), PERIODO)).rejects.toThrow(
      'No pudimos leer el reporte',
    );
  });
});

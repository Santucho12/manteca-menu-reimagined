import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ventasPorTipo } from '../../src/lib/reportes/consultas';
import { listarVentas } from '../../src/lib/ventas/consultas';
import { sembrarVentaConRenglones } from '../reportes-de-prueba';
import { clienteComo } from '../sesiones';
import { borrarVentas, idDeCanal, productoParaVender, type ParaVender } from '../ventas-de-prueba';

// Un período propio, julio de 2017, para no cruzarse con lo que siembran otros tests.
const PERIODO = { desde: '2017-07-01', hasta: '2017-07-31' };
const ventas: string[] = [];
let producto: ParaVender;
let local: string;
let encargo: string;

const vender = (fecha: string, precioCentavos: number, extra: Record<string, unknown> = {}) =>
  sembrarVentaConRenglones({
    fecha,
    renglones: [{ producto, cantidad: 1, precioCentavos }],
    ...extra,
  });

beforeAll(async () => {
  producto = await productoParaVender();
  local = await idDeCanal('Local');
  encargo = await idDeCanal('Encargo');
  ventas.push(
    await vender('2017-07-03', 100000, { canalId: local }),
    await vender('2017-07-04', 200000, { canalId: local }),
    await vender('2017-07-05', 500000, { canalId: encargo }),
    await vender('2017-07-06', 900000, { canalId: encargo, anulado: true }),
    await vender('2017-07-07', 50000),
  );
});

afterAll(() => borrarVentas(ventas, { categoriasDelMenu: [producto.categoriaId] }));

describe('reporte_ventas_por_tipo', () => {
  it('suma cada tipo sin lo anulado, de mayor a menor, y las viejas sin tipo aparte', async () => {
    expect(await ventasPorTipo(await clienteComo('admin'), PERIODO)).toEqual([
      { canal_id: encargo, tipo: 'Encargo', ventas: 1, monto_centavos: 500000 },
      { canal_id: local, tipo: 'Local', ventas: 2, monto_centavos: 300000 },
      { canal_id: null, tipo: 'Sin tipo', ventas: 1, monto_centavos: 50000 },
    ]);
  });

  it.each(['caja', 'invitado', 'encargado'] as const)('%s no lo lee', async (rol) => {
    await expect(ventasPorTipo(await clienteComo(rol), PERIODO)).rejects.toThrow();
  });
});

describe('la lista de ventas filtrada por tipo', () => {
  it('muestra solo las de ese tipo, y sus totales siguen al filtro', async () => {
    const filtros = { ...PERIODO, origen: null, medio: null, estado: null, pagina: 1 };
    const lista = await listarVentas(await clienteComo('admin'), { ...filtros, tipo: local });
    expect(lista.filas).toHaveLength(2);
    expect(lista.totales.cobradoCentavos).toBe(300000);
    expect(lista.totales.cobradas).toBe(2);
  });
});

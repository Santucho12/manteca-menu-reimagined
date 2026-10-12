import { afterAll, describe, expect, it } from 'vitest';
import { datosDeAvisos, datosDelInicio } from '../../src/lib/inicio/consultas';
import {
  borrarCierres,
  diaLibre,
  diaSiguiente,
  sembrarCierre,
  sembrarCierreConSalidas,
} from '../cierres-de-prueba';
import { clienteSecretoDePruebas } from '../clientes';
import { borrarGastos, sembrarGasto } from '../gastos-de-prueba';
import { sembrarVentaConRenglones } from '../reportes-de-prueba';
import { clienteComo } from '../sesiones';
import { borrarVentas, productoParaVender } from '../ventas-de-prueba';

const cierres: string[] = [];
const gastos: string[] = [];

afterAll(async () => {
  await borrarGastos({ gastos });
  await borrarCierres(cierres);
}, 30_000);

async function avisos(hoy = '2099-01-01') {
  return datosDeAvisos(await clienteComo('admin'), hoy);
}

async function marcar(id: string, cambios: Record<string, unknown>) {
  const { error } = await clienteSecretoDePruebas()
    .from('cierres_de_caja')
    .update(cambios as never)
    .eq('id', id);
  if (error) throw new Error(`No pude marcar el cierre: ${error.message}`);
}

describe('avisos del inicio', () => {
  it('cuenta los cierres con diferencia sin revisar, no los revisados', async () => {
    const antes = (await avisos()).conDiferencia.cantidad;
    const fecha = diaLibre();
    const con = await sembrarCierre({ fecha });
    const revisado = await sembrarCierre({ fecha: diaSiguiente(fecha) });
    cierres.push(con.id, revisado.id);
    await marcar(con.id, { estado: 'con_diferencia' });
    await marcar(revisado.id, { estado: 'con_diferencia' });
    await marcar(revisado.id, { revisado: true });
    const despues = (await avisos()).conDiferencia;
    expect(despues.cantidad).toBe(antes + 1);
    expect(despues.desde! <= fecha).toBe(true);
  });

  it('cuenta los gastos sin clasificar, no los anulados', async () => {
    const antes = (await avisos()).sinClasificar.cantidad;
    const fecha = diaLibre();
    cierres.push(await sembrarCierreConSalidas(fecha));
    gastos.push((await sembrarGasto({ categoria: 'Sin clasificar', fecha, anulado: true })).id);
    const despues = (await avisos()).sinClasificar;
    expect(despues.cantidad).toBe(antes + 1);
    expect(despues.categoriaId).toMatch(/^[0-9a-f-]{36}$/);
    expect(despues.desde! <= fecha).toBe(true);
  });

  it('avisa si ayer no tiene cierre, y no si lo tiene', async () => {
    const fecha = diaLibre();
    cierres.push((await sembrarCierre({ fecha })).id);
    expect((await avisos(diaSiguiente(fecha))).ayerSinCierre).toBeNull();
    expect((await avisos(diaSiguiente(fecha, 2))).ayerSinCierre).toBe(diaSiguiente(fecha));
  });

  it('sin ningun cierre anterior, ayer no se avisa', async () => {
    expect((await avisos('1990-01-02')).ayerSinCierre).toBeNull();
  });
});

describe('datos del inicio', () => {
  it('trae los numeros del mes y el producto que mas vendio', async () => {
    const producto = await productoParaVender();
    const venta = await sembrarVentaConRenglones({
      fecha: '2017-06-10',
      renglones: [{ producto, cantidad: 2, precioCentavos: 100000 }],
    });
    try {
      const datos = await datosDelInicio(await clienteComo('admin'), '2017-06-20');
      expect(datos.actual.resultado.ventasCentavos).toBe(200000);
      expect(datos.masVendidos[0]?.clave).toBe(producto.productoId);
      expect(datos.meses.at(-1)?.mes).toBe('2017-06');
    } finally {
      await borrarVentas([venta], { categoriasDelMenu: [producto.categoriaId] });
    }
  });
});

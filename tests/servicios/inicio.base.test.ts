import { afterAll, describe, expect, it } from 'vitest';
import { datosDeAvisos, datosDelInicio } from '../../src/lib/inicio/consultas';
import {
  borrarCierres,
  diaLibre,
  diaSiguiente,
  sembrarCierre,
  sembrarCierreConSalidas,
} from '../cierres-de-prueba';
import { borrarGastos, sembrarGasto, sembrarRecurrente } from '../gastos-de-prueba';
import { sembrarVentaConRenglones } from '../reportes-de-prueba';
import { clienteComo } from '../sesiones';
import { borrarVentas, productoParaVender, sembrarVentaConPago } from '../ventas-de-prueba';

const cierres: string[] = [];
const gastos: string[] = [];
const ventas: string[] = [];
const sumarUnDia = (fecha: string) => diaSiguiente(fecha);

afterAll(async () => {
  await borrarGastos({ gastos });
  await borrarCierres(cierres);
  await borrarVentas(ventas);
}, 30_000);

async function avisos(hoy = '2099-01-01') {
  return datosDeAvisos(await clienteComo('admin'), hoy);
}

describe('avisos del inicio', () => {
  it('cuenta los cierres con diferencia de la ultima semana, no los que cierran', async () => {
    const fecha = diaLibre();
    const hoy = diaSiguiente(fecha);
    const antes = (await avisos(sumarUnDia(hoy))).conDiferencia.cantidad;
    // Sin ventas, el cierre sembrado (fondo $10.000 y $20.000 en efectivo) tiene diferencia.
    const con = await sembrarCierre({ fecha });
    const cierra = await sembrarCierre({ fecha: sumarUnDia(hoy) });
    cierres.push(con.id, cierra.id);
    ventas.push(
      await sembrarVentaConPago({ fecha: sumarUnDia(hoy), medio: 'efectivo', centavos: 1000000 }),
    );
    const despues = (await avisos(sumarUnDia(hoy))).conDiferencia;
    expect(despues.cantidad).toBe(antes + 1);
    expect(despues.desde! <= fecha).toBe(true);
  });

  it('un cierre que espera las ventas no cuenta como con diferencia', async () => {
    // Despues del ultimo dia con ventas de Fudo: el dia no tiene ventas cargadas.
    const fecha = '2099-05-20';
    const antes = (await avisos(diaSiguiente(fecha))).conDiferencia.cantidad;
    cierres.push((await sembrarCierre({ fecha })).id);
    const despues = (await avisos(diaSiguiente(fecha))).conDiferencia.cantidad;
    expect(despues).toBe(antes);
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

  it('trae las ventas de ayer y su cierre con diferencia', async () => {
    const fecha = diaLibre();
    const producto = await productoParaVender();
    const venta = await sembrarVentaConRenglones({
      fecha,
      renglones: [{ producto, cantidad: 1, precioCentavos: 80000 }],
    });
    const cierre = await sembrarCierre({ fecha });
    cierres.push(cierre.id);
    try {
      const { ayer } = await datosDelInicio(await clienteComo('admin'), diaSiguiente(fecha));
      expect(ayer).toMatchObject({ dia: fecha, ventas: 1, montoCentavos: 80000 });
      expect(ayer.cierre.estado).toBe('con_diferencia');
    } finally {
      await borrarVentas([venta], { categoriasDelMenu: [producto.categoriaId] });
    }
  });

  it('si ayer no hubo ventas, no avisa que falta el cierre', async () => {
    const fecha = diaLibre();
    cierres.push((await sembrarCierre({ fecha })).id);
    const datos = await datosDelInicio(await clienteComo('admin'), diaSiguiente(fecha, 2));
    expect(datos.ayer.ventas).toBe(0);
    expect(datos.avisos.some((a) => a.texto.startsWith('Ayer no se cargó'))).toBe(false);
  });

  it('trae los recurrentes que vencen en los proximos 7 dias', async () => {
    const recurrente = await sembrarRecurrente({ primerVencimiento: '2099-03-12' });
    try {
      const datos = await datosDelInicio(await clienteComo('admin'), '2099-03-10');
      const item = datos.vencimientos.items.find((v) => v.id === recurrente.id);
      expect(item).toMatchObject({ fecha: '2099-03-12', montoCentavos: 50000000 });
    } finally {
      await borrarGastos({ recurrentes: [recurrente.id] });
    }
  });
});

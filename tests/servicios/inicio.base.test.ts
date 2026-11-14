import { afterAll, describe, expect, it } from 'vitest';
import { datosDeAvisos, datosDelInicio, pagosDelInicio } from '../../src/lib/inicio/consultas';
import {
  borrarCierres,
  borrarDiasSinAbrir,
  diaLibre,
  diaSiguiente,
  sembrarCierre,
  sembrarCierreConSalidas,
  sembrarDiaSinAbrir,
} from '../cierres-de-prueba';
import {
  borrarGastos,
  generarDelFijo,
  sembrarGasto,
  sembrarPorPagar,
  sembrarRecurrente,
} from '../gastos-de-prueba';
import { sembrarVentaConRenglones } from '../reportes-de-prueba';
import { clienteComo } from '../sesiones';
import { borrarVentas, productoParaVender, sembrarVentaConPago } from '../ventas-de-prueba';

const cierres: string[] = [];
const gastos: string[] = [];
const ventas: string[] = [];
const porPagar: string[] = [];
const recurrentes: string[] = [];
const diasSinAbrir: string[] = [];
const sumarUnDia = (fecha: string) => diaSiguiente(fecha);

afterAll(async () => {
  await borrarGastos({ gastos, porPagar, recurrentes });
  await borrarCierres(cierres);
  await borrarVentas(ventas);
  await borrarDiasSinAbrir(diasSinAbrir);
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

  it('si ayer esta marcado como que el local no abrio, no avisa', async () => {
    const fecha = diaLibre();
    cierres.push((await sembrarCierre({ fecha })).id);
    const ayer = diaSiguiente(fecha);
    await sembrarDiaSinAbrir({ fecha: ayer });
    diasSinAbrir.push(ayer);
    expect((await avisos(diaSiguiente(fecha, 2))).ayerSinCierre).toBeNull();
  });
});

describe('pagos del inicio', () => {
  const HOY = '2099-03-10';

  it('cuenta lo vencido y lo que vence esta semana de lo anotado a mano', async () => {
    const admin = await clienteComo('admin');
    const antes = await pagosDelInicio(admin, HOY);
    porPagar.push((await sembrarPorPagar({ vencimiento: '2099-03-01' })).id);
    porPagar.push((await sembrarPorPagar({ vencimiento: '2099-03-12' })).id);
    const despues = await pagosDelInicio(admin, HOY);
    expect(despues.vencidos).toBe(antes.vencidos + 1);
    expect(despues.estaSemana).toBe(antes.estaSemana + 1);
  });

  it('un fijo con su por pagar ya generado no se cuenta dos veces', async () => {
    const admin = await clienteComo('admin');
    const antes = await pagosDelInicio(admin, HOY);
    const fijo = await sembrarRecurrente({ primerVencimiento: '2099-03-12' });
    recurrentes.push(fijo.id);
    await generarDelFijo(fijo.id, '2099-03-12');
    const despues = await pagosDelInicio(admin, HOY);
    expect(despues.estaSemana).toBe(antes.estaSemana + 1);
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

  it('aunque ayer no tenga ventas cargadas, avisa que falta el cierre', async () => {
    const fecha = diaLibre();
    cierres.push((await sembrarCierre({ fecha })).id);
    const datos = await datosDelInicio(await clienteComo('admin'), diaSiguiente(fecha, 2));
    expect(datos.avisos.some((a) => a.texto.startsWith('Ayer no se cargó'))).toBe(true);
  });

  it('cuenta las ventas del mes que no tienen productos, las del Excel de Fudo', async () => {
    const admin = await clienteComo('admin');
    const antes = (await datosDelInicio(admin, '2016-03-20')).sinDetalle;
    ventas.push(await sembrarVentaConPago({ fecha: '2016-03-10', medio: 'qr', centavos: 100000 }));
    expect((await datosDelInicio(admin, '2016-03-20')).sinDetalle).toBe(antes + 1);
  });
});

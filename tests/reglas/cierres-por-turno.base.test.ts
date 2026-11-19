import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { diaEnArgentina } from '../../src/lib/fechas';
import type { Json } from '../../src/lib/supabase/tipos';
import { guardarVentaDelMostrador } from '../../src/lib/vender/escritura';
import {
  borrarCierres,
  datosDeCierre,
  diaLibre,
  diaSiguiente,
  sembrarCierre,
} from '../cierres-de-prueba';
import type { RolDePrueba } from '../cuentas';
import { clienteComo } from '../sesiones';
import {
  borrarVentas,
  datosDeVenta,
  idDeCanal,
  productoParaVender,
  sembrarVentaConPago,
  ventaDe,
  type ParaVender,
} from '../ventas-de-prueba';

const HOY = diaEnArgentina(new Date());
const cierres: string[] = [];
const ventas: string[] = [];
const categorias: string[] = [];
let producto: ParaVender;

beforeAll(async () => {
  producto = await productoParaVender();
  categorias.push(producto.categoriaId);
});

afterAll(async () => {
  await borrarVentas(ventas, { categoriasDelMenu: categorias });
  await borrarCierres(cierres);
});

async function guardar(rol: RolDePrueba, datos: Json) {
  const respuesta = await (await clienteComo(rol)).rpc('cierres_guardar', { datos });
  if (respuesta.data) cierres.push(respuesta.data);
  return respuesta;
}

async function sembrar(semilla: Parameters<typeof sembrarCierre>[0]) {
  const cierre = await sembrarCierre(semilla);
  cierres.push(cierre.id);
  return cierre;
}

async function venta(fecha: string, turno: 1 | 2, centavos: number) {
  const id = await sembrarVentaConPago({ fecha, turno, medio: 'efectivo', centavos });
  ventas.push(id);
  return id;
}

// El producto de prueba sale $1.000 la unidad.
async function venderEnElMostrador(): Promise<string> {
  const resultado = await guardarVentaDelMostrador(await clienteComo('caja'), {
    clave: crypto.randomUUID(),
    renglones: [
      {
        productoId: producto.productoId,
        presentacionId: producto.presentacionId,
        cantidad: 1,
        precioCentavos: 100000,
      },
    ],
    pagos: [{ medio: 'efectivo', montoCentavos: 100000 }],
  });
  if (!resultado.ok) throw new Error(resultado.mensaje);
  ventas.push(resultado.datos.id);
  return resultado.datos.id;
}

type Fila = { id: string; turno: number; ventas_efectivo_centavos: number };

async function filasDelDia(fecha: string): Promise<Fila[]> {
  const admin = await clienteComo('admin');
  const { data } = await admin.rpc('cierres_con_resultado', { desde: fecha, hasta: fecha });
  return (data ?? []) as unknown as Fila[];
}

describe('un cierre por turno', () => {
  it('el mismo día acepta el del mediodía y el de la noche', async () => {
    const fecha = diaLibre();
    const mediodia = await guardar('caja', datosDeCierre(fecha, { turno: 1 }));
    const noche = await guardar('caja', datosDeCierre(fecha, { turno: 2 }));
    expect(mediodia.error).toBeNull();
    expect(noche.error).toBeNull();
  });

  it('rechaza un segundo cierre del mismo turno', async () => {
    const fecha = diaLibre();
    await guardar('caja', datosDeCierre(fecha, { turno: 1 }));
    const otra = await guardar('caja', datosDeCierre(fecha, { turno: 1 }));
    expect(otra.error?.code).toBe('PC302');
  });

  it('sin turno, el cierre es de la noche', async () => {
    const { data: id } = await guardar('caja', datosDeCierre(diaLibre()));
    const fila = (await filasDelDia((await filaPorId(id!)).fecha)).find((f) => f.id === id);
    expect(fila?.turno).toBe(2);
  });
});

async function filaPorId(id: string) {
  const admin = await clienteComo('admin');
  const { data } = await admin.from('cierres_de_caja').select('fecha, turno').eq('id', id).single();
  return data as { fecha: string; turno: number };
}

describe('lo esperado de cada turno', () => {
  it('suma solo las ventas de su turno', async () => {
    const fecha = diaLibre();
    await venta(fecha, 1, 100000);
    await venta(fecha, 2, 250000);
    const mediodia = await sembrar({ fecha, turno: 1 });
    const noche = await sembrar({ fecha, turno: 2 });
    const filas = await filasDelDia(fecha);
    expect(filas.find((f) => f.id === mediodia.id)).toMatchObject({
      turno: 1,
      ventas_efectivo_centavos: 100000,
    });
    expect(filas.find((f) => f.id === noche.id)).toMatchObject({
      turno: 2,
      ventas_efectivo_centavos: 250000,
    });
  });
});

describe('el fondo sugerido', () => {
  async function fondo(fecha: string, turno: 1 | 2) {
    const caja = await clienteComo('caja');
    const sugerido = await caja.rpc('cierres_fondo_sugerido', { la_fecha: fecha, el_turno: turno });
    const dia = await caja.rpc('cierres_fecha_del_fondo', { la_fecha: fecha, el_turno: turno });
    return { centavos: sugerido.data, dia: dia.data };
  }

  it('la noche arranca con lo que dejó el mediodía del mismo día', async () => {
    const fecha = diaLibre();
    await sembrar({ fecha: diaSiguiente(fecha, -1), turno: 2, quedaEnCajaCentavos: 55500 });
    await sembrar({ fecha, turno: 1, quedaEnCajaCentavos: 77700 });
    expect(await fondo(fecha, 2)).toEqual({ centavos: 77700, dia: fecha });
  });

  it('el mediodía arranca con lo que dejó la noche anterior', async () => {
    const fecha = diaLibre();
    const ayer = diaSiguiente(fecha, -1);
    await sembrar({ fecha: ayer, turno: 2, quedaEnCajaCentavos: 55500 });
    await sembrar({ fecha, turno: 2, quedaEnCajaCentavos: 99900 });
    expect(await fondo(fecha, 1)).toEqual({ centavos: 55500, dia: ayer });
  });
});

describe('la noche de hoy espera al mediodía', () => {
  it('no se carga si el mediodía tiene ventas en la caja y no tiene cierre', async () => {
    await venta(HOY, 1, 100000);
    const noche = await guardar('caja', datosDeCierre(HOY, { turno: 2 }));
    expect(noche.error?.code).toBe('PC309');
    await borrarVentas(ventas.splice(0));
  });

  it('se carga si el mediodía no tuvo ventas', async () => {
    const noche = await guardar('caja', datosDeCierre(HOY, { turno: 2 }));
    expect(noche.error).toBeNull();
    await borrarCierres(cierres.splice(0));
  });
});

describe('el turno de cada venta', () => {
  it('la del mostrador va al mediodía si el mediodía no cerró, y después a la noche', async () => {
    const antes = await venderEnElMostrador();
    expect((await ventaDe(antes)).turno).toBe(1);
    const cierre = await sembrar({ fecha: HOY, turno: 1 });
    const despues = await venderEnElMostrador();
    expect((await ventaDe(despues)).turno).toBe(2);
    const admin = await clienteComo('admin');
    await admin
      .from('cierres_de_caja')
      .update({ anulado: true, motivo_anulacion: 'Prueba de turnos' })
      .eq('id', cierre.id);
    expect((await ventaDe(despues)).turno).toBe(2);
    expect((await ventaDe(antes)).turno).toBe(1);
  });

  it('la cargada a mano guarda el turno elegido', async () => {
    const datos = datosDeVenta(
      diaLibre(),
      await idDeCanal('Encargo'),
      [{ producto, cantidad: 1, precioCentavos: 100000 }],
      { clave: crypto.randomUUID(), en_la_caja: true, turno: 1 },
    );
    const { data: id, error } = await (
      await clienteComo('admin')
    ).rpc('ventas_guardar_manual', { datos });
    expect(error).toBeNull();
    ventas.push(id!);
    expect((await ventaDe(id!)).turno).toBe(1);
  });
});

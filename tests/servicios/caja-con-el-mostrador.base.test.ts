import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { diaEnArgentina } from '../../src/lib/fechas';
import { guardarVentaDelMostrador } from '../../src/lib/vender/escritura';
import {
  borrarCanal,
  cambiarEstadoDeCanal,
  editarCanal,
  guardarVenta,
  MENSAJES_DE_VENTAS,
} from '../../src/lib/ventas/escritura';
import type { DatosDeVenta } from '../../src/lib/ventas/esquemas';
import { clienteSecretoDePruebas } from '../clientes';
import { borrarCierres, diaLibre, sembrarCierre } from '../cierres-de-prueba';
import { clienteComo } from '../sesiones';
import { borrarVentas, idDeCanal, productoParaVender, type ParaVender } from '../ventas-de-prueba';

const HOY = diaEnArgentina(new Date());
const ventas: string[] = [];
const cierres: string[] = [];
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

type Vendido = { ventas_efectivo_centavos: number; ventas_transferencia_centavos: number };

type Fila = Vendido & { anulado: boolean; turno: number };

/** Lo vendido que cuenta para la caja de ese turno, según su cierre (lo siembra si no hay). */
async function vendidoParaLaCaja(fecha: string, turno: 1 | 2 = 2): Promise<Vendido> {
  const admin = await clienteComo('admin');
  const leer = async () =>
    (
      ((await admin.rpc('cierres_con_resultado', { desde: fecha, hasta: fecha })).data ??
        []) as unknown as Fila[]
    ).find((f) => !f.anulado && f.turno === turno);
  const fila = await leer();
  if (fila) return fila;
  cierres.push((await sembrarCierre({ fecha, turno })).id);
  return (await leer())!;
}

// El producto de prueba sale $1.000 la unidad.
async function venderEnElMostrador(medio: 'efectivo' | 'transferencia') {
  const resultado = await guardarVentaDelMostrador(await clienteComo('caja'), {
    clave: crypto.randomUUID(),
    renglones: [
      {
        productoId: producto.productoId,
        presentacionId: producto.presentacionId,
        cantidad: 3,
        precioCentavos: 100000,
      },
    ],
    pagos: [{ medio, montoCentavos: 300000 }],
  });
  if (!resultado.ok) throw new Error(resultado.mensaje);
  ventas.push(resultado.datos.id);
}

async function cargarAMano(fecha: string, enLaCaja: boolean) {
  const datos: DatosDeVenta = {
    clave: crypto.randomUUID(),
    fecha,
    canalId: await idDeCanal('Cheaf'),
    medio: 'transferencia',
    comentario: '',
    enLaCaja,
    turno: '2',
    renglones: [
      {
        opcion: `${producto.productoId}|${producto.presentacionId}`,
        cantidad: '1',
        precio: '5.000',
      },
    ],
  };
  const resultado = await guardarVenta(await clienteComo('admin'), datos);
  if (!resultado.ok) throw new Error(resultado.mensaje);
  ventas.push(resultado.datos.id);
}

describe('lo esperado de la caja', () => {
  it('suma las ventas del mostrador del turno, en su medio', async () => {
    // Con el mediodía de hoy cerrado, lo que se vende va a la noche; su cierre se lee al final,
    // porque con la noche cerrada ya no se vende.
    await vendidoParaLaCaja(HOY, 1);
    await venderEnElMostrador('efectivo');
    await venderEnElMostrador('transferencia');
    expect(await vendidoParaLaCaja(HOY)).toMatchObject({
      ventas_efectivo_centavos: 300000,
      ventas_transferencia_centavos: 300000,
    });
  });

  it('no suma una venta a mano que no se cobró en la caja', async () => {
    const fecha = diaLibre();
    await cargarAMano(fecha, false);
    expect((await vendidoParaLaCaja(fecha)).ventas_transferencia_centavos).toBe(0);
  });

  it('suma una venta a mano marcada como cobrada en la caja', async () => {
    const fecha = diaLibre();
    await cargarAMano(fecha, true);
    expect((await vendidoParaLaCaja(fecha)).ventas_transferencia_centavos).toBe(500000);
  });

  it('ya no espera ventas de Fudo: la fila no trae ese dato', async () => {
    const fila = await vendidoParaLaCaja(diaLibre());
    expect(fila).not.toHaveProperty('ventas_cargadas');
  });
});

describe('el tipo de venta Local', () => {
  it('es del sistema: no se renombra, no se desactiva y no se borra', async () => {
    const admin = await clienteComo('admin');
    const local = await idDeCanal('Local');
    const delSistema = { ok: false, mensaje: MENSAJES_DE_VENTAS.canalDelSistema };
    expect(await editarCanal(admin, local, { nombre: 'Salón' })).toEqual(delSistema);
    expect(await cambiarEstadoDeCanal(admin, local, false)).toEqual(delSistema);
    expect(await borrarCanal(admin, local)).toEqual(delSistema);
    const { data } = await clienteSecretoDePruebas()
      .from('canales_de_venta')
      .select('nombre, activo, de_sistema')
      .eq('id', local)
      .single();
    expect(data).toEqual({ nombre: 'Local', activo: true, de_sistema: true });
  });

  it('cada local tiene el suyo', async () => {
    expect(await idDeCanal('Local', true)).toEqual(expect.any(String));
  });
});

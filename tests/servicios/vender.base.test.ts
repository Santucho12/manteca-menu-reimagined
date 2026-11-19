import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { diaEnArgentina } from '../../src/lib/fechas';
import type { Medio } from '../../src/lib/caja/resultado';
import { catalogoParaVender } from '../../src/lib/vender/consultas';
import { guardarVentaDelMostrador, MENSAJES_DEL_MOSTRADOR } from '../../src/lib/vender/escritura';
import type { VentaDelMostrador } from '../../src/lib/vender/esquemas';
import { anularVenta } from '../../src/lib/ventas/escritura';
import { idDeCuentaDePrueba } from '../consultas-de-prueba';
import {
  sembrarCategoria,
  sembrarProducto,
  type CategoriaSembrada,
  type ProductoSembrado,
} from '../menu-de-prueba';
import { clienteComo } from '../sesiones';
import { borrarVentas, idDeCanal, ventaDe } from '../ventas-de-prueba';

const HOY = diaEnArgentina(new Date());
const ventas: string[] = [];
const categorias: string[] = [];
let categoria: CategoriaSembrada;
let hereda: ProductoSembrado;
let propio: ProductoSembrado;
let oculto: ProductoSembrado;
let desactivado: ProductoSembrado;

// Docena $18.000 y Unidad $2.000 para todos; uno pisa la Docena con $20.000.
beforeAll(async () => {
  categoria = await sembrarCategoria({
    presentaciones: ['Docena', 'Unidad'],
    compartidos: [1800000, 200000],
  });
  categorias.push(categoria.id);
  hereda = await sembrarProducto(categoria, { precios: [null, null] });
  propio = await sembrarProducto(categoria, { precios: [2000000, null] });
  oculto = await sembrarProducto(categoria, { visible: false, precios: [null, null] });
  desactivado = await sembrarProducto(categoria, { activo: false, precios: [null, null] });
});

afterAll(() => borrarVentas(ventas, { categoriasDelMenu: categorias }));

const docena = () => categoria.presentaciones[0]!.id;
const unidad = () => categoria.presentaciones[1]!.id;

function renglon(producto: ProductoSembrado, presentacionId: string, precioCentavos: number) {
  return { productoId: producto.id, presentacionId, cantidad: 2, precioCentavos };
}

function venta(
  renglones: VentaDelMostrador['renglones'],
  pagos: { medio: Medio; montoCentavos: number }[],
): VentaDelMostrador {
  return { clave: crypto.randomUUID(), renglones, pagos };
}

async function vender(datos: VentaDelMostrador, rol: 'caja' | 'admin' = 'caja') {
  const resultado = await guardarVentaDelMostrador(await clienteComo(rol), datos);
  if (resultado.ok) ventas.push(resultado.datos.id);
  return resultado;
}

const formasDe = async (productoId: string) =>
  (await catalogoParaVender(await clienteComo('caja')))
    .flatMap((c) => c.productos)
    .find((p) => p.id === productoId)?.formas;

describe('el catálogo para vender', () => {
  it('trae cada forma de venta con el precio que rige: el propio o el de la categoría', async () => {
    expect((await formasDe(hereda.id))?.map((f) => f.precioCentavos)).toEqual([1800000, 200000]);
    expect((await formasDe(propio.id))?.map((f) => f.precioCentavos)).toEqual([2000000, 200000]);
  });

  it('ofrece lo que no se muestra en la carta, pero no lo desactivado', async () => {
    expect(await formasDe(oculto.id)).toHaveLength(2);
    expect(await formasDe(desactivado.id)).toBeUndefined();
  });

  it.each(['invitado', 'encargado'] as const)('%s no lo lee', async (rol) => {
    await expect(catalogoParaVender(await clienteComo(rol))).rejects.toThrow();
  });
});

describe('guardar una venta del mostrador', () => {
  it('Caja la guarda de hoy, del mostrador, de tipo Local, cobrada en la caja y a su nombre', async () => {
    const datos = venta(
      [renglon(hereda, docena(), 1800000)],
      [{ medio: 'efectivo', montoCentavos: 3600000 }],
    );
    const resultado = await vender(datos);
    expect(resultado).toEqual({
      ok: true,
      datos: { id: expect.any(String), totalCentavos: 3600000 },
    });
    const guardada = await ventaDe(resultado.ok ? resultado.datos.id : '');
    expect(guardada).toMatchObject({
      origen: 'mostrador',
      fecha: HOY,
      en_la_caja: true,
      estado: 'cerrada',
      total_centavos: 3600000,
      canal_id: await idDeCanal('Local'),
      creado_por: await idDeCuentaDePrueba('caja'),
    });
    expect(guardada.renglones).toMatchObject([
      { producto_id: hereda.id, cantidad: 2, precio_unitario_centavos: 1800000 },
    ]);
  });

  it('con dos medios guarda los dos pagos', async () => {
    const pagos = [
      { medio: 'efectivo' as const, montoCentavos: 1000000 },
      { medio: 'debito' as const, montoCentavos: 3000000 },
    ];
    const resultado = await vender(venta([renglon(propio, docena(), 2000000)], pagos));
    const guardada = await ventaDe(resultado.ok ? resultado.datos.id : '');
    expect(guardada.pagos.map((p) => [p.medio, p.monto_centavos]).sort()).toEqual([
      ['debito', 3000000],
      ['efectivo', 1000000],
    ]);
  });

  it('si el precio cambió con el ticket armado, no la guarda', async () => {
    const datos = venta(
      [renglon(propio, docena(), 1800000)],
      [{ medio: 'qr', montoCentavos: 3600000 }],
    );
    expect(await vender(datos)).toEqual({ ok: false, mensaje: MENSAJES_DEL_MOSTRADOR.precio });
  });

  it('un producto desactivado no se vende', async () => {
    const datos = venta(
      [renglon(desactivado, unidad(), 200000)],
      [{ medio: 'qr', montoCentavos: 400000 }],
    );
    expect(await vender(datos)).toEqual({
      ok: false,
      mensaje: MENSAJES_DEL_MOSTRADOR.productoNoDisponible,
    });
  });

  it('los pagos tienen que sumar el total', async () => {
    const datos = venta(
      [renglon(hereda, unidad(), 200000)],
      [{ medio: 'qr', montoCentavos: 300000 }],
    );
    expect(await vender(datos)).toEqual({ ok: false, mensaje: MENSAJES_DEL_MOSTRADOR.pagos });
  });

  it('mandada dos veces con la misma clave, queda una sola', async () => {
    const datos = venta(
      [renglon(hereda, unidad(), 200000)],
      [{ medio: 'efectivo', montoCentavos: 400000 }],
    );
    const primera = await vender(datos);
    const segunda = await vender(datos);
    expect(segunda).toEqual(primera);
  });

  it('el admin también vende en el mostrador', async () => {
    const datos = venta(
      [renglon(oculto, unidad(), 200000)],
      [{ medio: 'transferencia', montoCentavos: 400000 }],
    );
    expect((await vender(datos, 'admin')).ok).toBe(true);
  });

  it.each(['invitado', 'encargado'] as const)('%s no vende', async (rol) => {
    const datos = venta(
      [renglon(hereda, unidad(), 200000)],
      [{ medio: 'efectivo', montoCentavos: 400000 }],
    );
    const resultado = await guardarVentaDelMostrador(await clienteComo(rol), datos);
    expect(resultado).toEqual({ ok: false, mensaje: MENSAJES_DEL_MOSTRADOR.sinPermiso });
  });
});

describe('lo que Caja no puede', () => {
  it('no lee las ventas, ni la que acaba de cargar, y no las anula', async () => {
    const datos = venta(
      [renglon(hereda, unidad(), 200000)],
      [{ medio: 'efectivo', montoCentavos: 400000 }],
    );
    const resultado = await vender(datos);
    const id = resultado.ok ? resultado.datos.id : '';
    const caja = await clienteComo('caja');
    const { data } = await caja.from('ventas').select('id').eq('id', id);
    expect(data).toEqual([]);
    expect((await anularVenta(caja, id, 'Me equivoqué')).ok).toBe(false);
    expect((await ventaDe(id)).anulado).toBe(false);
  });
});

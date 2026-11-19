import { afterAll, describe, expect, it } from 'vitest';
import { SiembraDeCostos, sembrarUnidades, type DatosDeReceta } from '../costos-de-prueba';
import { clienteSecretoDePruebas } from '../clientes';
import { sembrarInsumo } from '../materia-prima-de-prueba';
import { clienteComo } from '../sesiones';

const siembra = new SiembraDeCostos();
afterAll(() => siembra.borrar());

async function guardar(datos: DatosDeReceta) {
  return (await clienteComo('admin')).rpc('recetas_guardar', { datos });
}

async function costosDe(productoId: string) {
  const { data, error } = await (await clienteComo('admin')).rpc('costos_de_productos');
  expect(error).toBeNull();
  return (data ?? []).filter((fila) => fila.producto_id === productoId);
}

// Harina a 128 centavos el gramo y huevo a $10 la unidad.
async function recetaDeMedialuna() {
  const { categoria, producto } = await siembra.menu();
  const harina = await siembra.insumo(3_200_000, 25_000);
  const huevo = await siembra.insumo(1_000, 1, 'unidad');
  return { categoria, producto, harina, huevo };
}

describe('el costo de un producto', () => {
  it('suma los insumos, el desperdicio, divide lo que rinde y multiplica las unidades', async () => {
    const { categoria, producto, harina, huevo } = await recetaDeMedialuna();
    await sembrarUnidades(categoria, 0, 1);
    await sembrarUnidades(categoria, 1, 12, 500);
    const renglones = [
      { insumo_id: harina.id, cantidad: 25 },
      { insumo_id: huevo.id, cantidad: 1 },
    ];
    const { error } = await guardar({
      producto_id: producto.id,
      rinde: 4,
      desperdicio_porcentaje: 10,
      renglones,
    });
    expect(error).toBeNull();
    // (3200 + 1000) * 1,10 / 4 = 1155 la unidad; la docena, 1155 * 12 + 500.
    expect(await costosDe(producto.id)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ costo_centavos: 1155, estado: 'ok' }),
        expect.objectContaining({ costo_centavos: 14_360, estado: 'ok' }),
      ]),
    );
  });

  it('redondea al centavo una sola vez, la mitad hacia arriba', async () => {
    const { categoria, producto } = await siembra.menu();
    const insumo = await siembra.insumo(25_000, 25_000);
    await sembrarUnidades(categoria, 0, 1);
    await guardar({
      producto_id: producto.id,
      rinde: 2,
      renglones: [{ insumo_id: insumo.id, cantidad: 1 }],
    });
    const unidad = (await costosDe(producto.id)).find(
      (f) => f.presentacion_id === categoria.presentaciones[0]!.id,
    );
    expect(unidad).toMatchObject({ costo_centavos: 1, estado: 'ok' });
  });

  it('una presentacion con receta propia usa la suya, mas el agregado', async () => {
    const { categoria, producto, harina } = await recetaDeMedialuna();
    await sembrarUnidades(categoria, 1, 12, 500);
    const docena = categoria.presentaciones[1]!.id;
    await guardar({
      producto_id: producto.id,
      renglones: [{ insumo_id: harina.id, cantidad: 10 }],
    });
    await guardar({
      producto_id: producto.id,
      presentacion_id: docena,
      renglones: [{ insumo_id: harina.id, cantidad: 100 }],
    });
    const filas = await costosDe(producto.id);
    expect(filas.find((f) => f.presentacion_id === docena)).toMatchObject({
      costo_centavos: 13_300,
    });
  });

  it('dice por que no tiene costo', async () => {
    const { categoria, producto } = await siembra.menu();
    const sinPrecio = await siembra.insumo(null);
    expect((await costosDe(producto.id)).map((f) => f.estado)).toEqual([
      'sin_receta',
      'sin_receta',
    ]);
    await guardar({
      producto_id: producto.id,
      renglones: [{ insumo_id: sinPrecio.id, cantidad: 1 }],
    });
    await sembrarUnidades(categoria, 0, 1);
    const estados = (await costosDe(producto.id)).map((f) => f.estado).sort();
    expect(estados).toEqual(['insumo_sin_precio', 'sin_unidades']);
  });
});

describe('guardar una receta', () => {
  it('desactiva lo que no vino y lo reactiva si vuelve', async () => {
    const { producto, harina, huevo } = await recetaDeMedialuna();
    const dos = [
      { insumo_id: harina.id, cantidad: 25 },
      { insumo_id: huevo.id, cantidad: 1 },
    ];
    await guardar({ producto_id: producto.id, renglones: dos });
    await guardar({ producto_id: producto.id, renglones: [dos[0]!] });
    const secreto = clienteSecretoDePruebas();
    const leer = async () =>
      (
        await secreto
          .from('renglones_de_receta')
          .select('insumo_id, activo')
          .eq('insumo_id', huevo.id)
      ).data;
    expect(await leer()).toEqual([{ insumo_id: huevo.id, activo: false }]);
    await guardar({ producto_id: producto.id, renglones: dos });
    expect(await leer()).toEqual([{ insumo_id: huevo.id, activo: true }]);
  });

  it('rechaza un insumo de otro local: PK301', async () => {
    const { producto } = await siembra.menu();
    const ajeno = await sembrarInsumo({ otroLocal: true });
    siembra.insumos.push(ajeno.id);
    const { error } = await guardar({
      producto_id: producto.id,
      renglones: [{ insumo_id: ajeno.id, cantidad: 1 }],
    });
    expect(error?.code).toBe('PK301');
  });

  it('rechaza una presentacion de otra categoria: PK301', async () => {
    const { producto, harina } = await recetaDeMedialuna();
    const otra = await siembra.menu();
    const { error } = await guardar({
      producto_id: producto.id,
      presentacion_id: otra.categoria.presentaciones[0]!.id,
      renglones: [{ insumo_id: harina.id, cantidad: 1 }],
    });
    expect(error?.code).toBe('PK301');
  });

  it('rechaza un insumo desactivado que no estaba: PK302', async () => {
    const { producto } = await siembra.menu();
    const apagado = await sembrarInsumo({ activo: false });
    siembra.insumos.push(apagado.id);
    const { error } = await guardar({
      producto_id: producto.id,
      renglones: [{ insumo_id: apagado.id, cantidad: 1 }],
    });
    expect(error?.code).toBe('PK302');
  });

  it('rechaza insumos repetidos y la lista vacia: PK303 y PK304', async () => {
    const { producto, harina } = await recetaDeMedialuna();
    const repetidos = [1, 2].map((cantidad) => ({ insumo_id: harina.id, cantidad }));
    expect((await guardar({ producto_id: producto.id, renglones: repetidos })).error?.code).toBe(
      'PK303',
    );
    expect((await guardar({ producto_id: producto.id, renglones: [] })).error?.code).toBe('PK304');
  });

  it('un insumo en una receta no cambia su unidad de uso: PI303', async () => {
    const { producto, harina } = await recetaDeMedialuna();
    await guardar({ producto_id: producto.id, renglones: [{ insumo_id: harina.id, cantidad: 1 }] });
    const { error } = await (
      await clienteComo('admin')
    )
      .from('insumos')
      .update({ unidad_de_uso: 'ml' })
      .eq('id', harina.id);
    expect(error?.code).toBe('PI303');
  });
});

describe('volver a la receta del producto', () => {
  it('la presentacion deja su receta propia y vuelve a usar la del producto', async () => {
    const { categoria, producto, harina } = await recetaDeMedialuna();
    await sembrarUnidades(categoria, 1, 12);
    const docena = categoria.presentaciones[1]!.id;
    await guardar({
      producto_id: producto.id,
      renglones: [{ insumo_id: harina.id, cantidad: 10 }],
    });
    await guardar({
      producto_id: producto.id,
      presentacion_id: docena,
      renglones: [{ insumo_id: harina.id, cantidad: 100 }],
    });
    const admin = await clienteComo('admin');
    const { error } = await admin.rpc('recetas_usar_la_del_producto', {
      el_producto: producto.id,
      la_presentacion: docena,
    });
    expect(error).toBeNull();
    // 10 g a 128 centavos, por 12 unidades.
    const fila = (await costosDe(producto.id)).find((f) => f.presentacion_id === docena);
    expect(fila).toMatchObject({ costo_centavos: 15_360, estado: 'ok' });
  });

  it('sin receta propia no hay nada que volver: PK305', async () => {
    const { categoria, producto } = await siembra.menu();
    const { error } = await (
      await clienteComo('admin')
    ).rpc('recetas_usar_la_del_producto', {
      el_producto: producto.id,
      la_presentacion: categoria.presentaciones[0]!.id,
    });
    expect(error?.code).toBe('PK305');
  });

  it('caja no lo hace', async () => {
    const { categoria, producto } = await siembra.menu();
    const { error } = await (
      await clienteComo('caja')
    ).rpc('recetas_usar_la_del_producto', {
      el_producto: producto.id,
      la_presentacion: categoria.presentaciones[0]!.id,
    });
    expect(error?.code).toBe('PK300');
  });
});

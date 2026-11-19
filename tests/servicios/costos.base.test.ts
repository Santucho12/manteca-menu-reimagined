import { afterAll, describe, expect, it } from 'vitest';
import {
  cuantosDebajoDelMinimo,
  listarCostos,
  margenesDelLocal,
  presentacionesParaAjustar,
  recetaDelProducto,
} from '../../src/lib/costos/consultas';
import { guardarMargenes, guardarReceta, guardarUnidades } from '../../src/lib/costos/escritura';
import { clienteSecretoDePruebas } from '../clientes';
import { SiembraDeCostos, sembrarUnidades } from '../costos-de-prueba';
import { idDelLocalPrincipal } from '../locales';
import { clienteComo } from '../sesiones';

const siembra = new SiembraDeCostos();
afterAll(async () => {
  await siembra.borrar();
  const secreto = clienteSecretoDePruebas();
  await secreto
    .from('configuracion_de_costos')
    .delete()
    .eq('local_id', await idDelLocalPrincipal(secreto));
});

const admin = () => clienteComo('admin');

// Un producto a $1.000 la unidad, con 35 g de un insumo a $10 el gramo: costo $350.
async function productoConCosto(precios: (number | null)[] = [100_000, 1_000_000]) {
  const { categoria, producto } = await siembra.menu(precios);
  const insumo = await siembra.insumo(1_000);
  await sembrarUnidades(categoria, 0, 1);
  const resultado = await guardarReceta(await admin(), {
    productoId: producto.id,
    presentacionId: '',
    rinde: '1',
    desperdicio: '0',
    renglones: [{ insumoId: insumo.id, cantidad: '35' }],
  });
  if (!resultado.ok) throw new Error(resultado.mensaje);
  return { categoria, producto, insumo };
}

async function filaDe(productoId: string, filtro: 'todos' | 'debajo' | 'sin_receta' = 'todos') {
  const lista = await listarCostos(await admin(), { filtro, orden: 'porcentaje' });
  return lista.find((fila) => fila.productoId === productoId);
}

describe('listarCostos', () => {
  it('cada presentacion con su costo, el precio del menu y la ganancia', async () => {
    const { producto } = await productoConCosto();
    const fila = await filaDe(producto.id);
    expect(fila?.presentaciones[0]).toMatchObject({
      nombre: 'Unidad',
      costo: 35_000,
      precio: 100_000,
      ganancia: 65_000,
      porcentaje: 65,
    });
    expect(fila?.presentaciones[1]).toMatchObject({
      nombre: 'Docena',
      motivo: 'Faltan las unidades',
    });
  });

  it('sin precio propio usa el de la categoria', async () => {
    const { categoria, producto } = await siembra.menu([null, null]);
    await clienteSecretoDePruebas().from('precios').insert({
      local_id: categoria.localId,
      presentacion_id: categoria.presentaciones[0]!.id,
      producto_id: null,
      monto_centavos: 90_000,
    });
    expect((await filaDe(producto.id))?.presentaciones[0]?.precio).toBe(90_000);
  });

  it('filtra lo que quedo debajo del minimo y lo que no tiene receta', async () => {
    const barato = await productoConCosto([50_000, null]);
    const sinReceta = await siembra.menu();
    expect(await filaDe(barato.producto.id, 'debajo')).toBeDefined();
    expect(await filaDe(sinReceta.producto.id, 'debajo')).toBeUndefined();
    expect(await filaDe(sinReceta.producto.id, 'sin_receta')).toBeDefined();
  });

  it('cuenta los productos debajo del minimo, para el aviso de Inicio', async () => {
    const antes = await cuantosDebajoDelMinimo(await admin());
    await productoConCosto([50_000, null]);
    expect(await cuantosDebajoDelMinimo(await admin())).toBe(antes + 1);
    expect(await cuantosDebajoDelMinimo(await clienteComo('caja'))).toBe(0);
  });

  it('caja no ve costos', async () => {
    await productoConCosto();
    expect(
      await listarCostos(await clienteComo('caja'), { filtro: 'todos', orden: 'nombre' }),
    ).toEqual([]);
  });
});

describe('recetaDelProducto', () => {
  it('trae los insumos con lo que cuestan y lo que aportan', async () => {
    const { producto, insumo } = await productoConCosto();
    const receta = await recetaDelProducto(await admin(), producto.id);
    expect(receta?.base?.renglones).toEqual([
      expect.objectContaining({
        insumoId: insumo.id,
        nombre: insumo.nombre,
        cantidad: 35,
        aporte: 35_000,
      }),
    ]);
    expect(receta?.presentaciones.map((p) => p.nombre)).toEqual(['Unidad', 'Docena']);
  });

  it('un id mal escrito no trae nada', async () => {
    expect(await recetaDelProducto(await admin(), 'no-es-un-id')).toBeNull();
  });
});

describe('guardar', () => {
  it('un insumo repetido se explica', async () => {
    const { producto, insumo } = await productoConCosto();
    const renglon = { insumoId: insumo.id, cantidad: '1' };
    const datos = { productoId: producto.id, presentacionId: '', rinde: '1', desperdicio: '0' };
    expect(await guardarReceta(await admin(), { ...datos, renglones: [renglon, renglon] })).toEqual(
      {
        ok: false,
        mensaje: 'Un insumo está dos veces en la receta.',
      },
    );
  });

  it('las unidades se cargan y se cambian', async () => {
    const { categoria } = await siembra.menu();
    const docena = categoria.presentaciones[1]!.id;
    expect(
      (await guardarUnidades(await admin(), docena, { unidades: '12', agregado: '' })).ok,
    ).toBe(true);
    expect(
      (await guardarUnidades(await admin(), docena, { unidades: '12', agregado: '500' })).ok,
    ).toBe(true);
    const ajustes = await presentacionesParaAjustar(await admin());
    const fila = ajustes.flatMap((c) => c.presentaciones).find((p) => p.id === docena);
    expect(fila).toMatchObject({ unidades: 12, agregadoCentavos: 50_000 });
  });

  it('los margenes se guardan y se leen, y sin cargar valen 65 y 50', async () => {
    const cliente = await admin();
    expect(await margenesDelLocal(await clienteComo('adminOtroLocal'))).toEqual({
      objetivo: 65,
      minimo: 50,
    });
    expect((await guardarMargenes(cliente, { objetivo: 70, minimo: 55 })).ok).toBe(true);
    expect((await guardarMargenes(cliente, { objetivo: 60, minimo: 40 })).ok).toBe(true);
    expect(await margenesDelLocal(cliente)).toEqual({ objetivo: 60, minimo: 40 });
  });
});

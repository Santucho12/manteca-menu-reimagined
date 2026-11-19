import { afterAll, describe, expect, it } from 'vitest';
import {
  insumoPorId,
  listarInsumos,
  type FiltrosDeInsumos,
} from '../../src/lib/materia-prima/consultas';
import {
  cambiarEstadoDeForma,
  cambiarEstadoDeInsumo,
  crearFormaDeCompra,
  crearInsumo,
  editarFormaDeCompra,
  editarInsumo,
} from '../../src/lib/materia-prima/escritura';
import type { DatosDeFormaDeCompra, DatosDeInsumo } from '../../src/lib/materia-prima/esquemas';
import {
  borrarInsumos,
  filaDe,
  nombreDeInsumo,
  sembrarFormaDeCompra,
  sembrarInsumo,
} from '../materia-prima-de-prueba';
import { borrarProveedores, sembrarProveedor } from '../proveedores-de-prueba';
import { clienteComo } from '../sesiones';

const insumos: string[] = [];
const proveedores: string[] = [];
afterAll(async () => {
  await borrarInsumos(insumos);
  await borrarProveedores(proveedores);
});

const TODOS: FiltrosDeInsumos = { busqueda: null, desactivados: false, pagina: 1 };
const FORMA: DatosDeFormaDeCompra = {
  proveedorId: '',
  comoSeCompra: 'Bolsa de 25 kg',
  contenido: '25.000',
  precio: '32.000',
};

function datos(nombre: string): DatosDeInsumo {
  return { nombre, unidad: 'g', observaciones: '' };
}

async function sembrar(...args: Parameters<typeof sembrarInsumo>) {
  const insumo = await sembrarInsumo(...args);
  insumos.push(insumo.id);
  return insumo;
}

async function admin() {
  return clienteComo('admin');
}

async function filasQueVe(filtros: Partial<FiltrosDeInsumos>) {
  return (await listarInsumos(await admin(), { ...TODOS, ...filtros })).filas;
}

describe('listarInsumos', () => {
  it('busca por nombre y trae el costo de hoy de cada uno', async () => {
    const insumo = await sembrar();
    await sembrarFormaDeCompra({ insumoId: insumo.id, localId: insumo.local_id });
    const [fila] = await filasQueVe({ busqueda: insumo.nombre });
    expect(fila).toMatchObject({
      id: insumo.id,
      unidad_de_uso: 'g',
      costo_por_unidad: 128,
      origen: 'referencia',
    });
  });

  it('un insumo sin precio viene sin costo', async () => {
    const insumo = await sembrar();
    const [fila] = await filasQueVe({ busqueda: insumo.nombre });
    expect(fila).toMatchObject({ costo_por_unidad: null, origen: null });
  });

  it('los desactivados solo si se piden', async () => {
    const apagado = await sembrar({ activo: false });
    expect(await filasQueVe({ busqueda: apagado.nombre })).toEqual([]);
    const desactivados = await filasQueVe({ busqueda: apagado.nombre, desactivados: true });
    expect(desactivados.map((fila) => fila.id)).toEqual([apagado.id]);
  });

  it('caja no ve insumos', async () => {
    await sembrar();
    const lista = await listarInsumos(await clienteComo('caja'), TODOS);
    expect(lista).toMatchObject({ filas: [], total: 0 });
  });
});

describe('insumoPorId', () => {
  it('trae la ficha con sus formas de compra y el nombre del proveedor', async () => {
    const insumo = await sembrar();
    const proveedor = await sembrarProveedor();
    proveedores.push(proveedor.id);
    await sembrarFormaDeCompra({
      insumoId: insumo.id,
      localId: insumo.local_id,
      proveedorId: proveedor.id,
    });
    const ficha = await insumoPorId(await admin(), insumo.id);
    expect(ficha).toMatchObject({ id: insumo.id, costo_por_unidad: 128, origen: 'referencia' });
    expect(ficha!.formas).toEqual([
      expect.objectContaining({
        como_se_compra: 'Bolsa de 25 kg',
        contenido: 25000,
        precio_referencia_centavos: 3_200_000,
        proveedor: proveedor.nombre,
        activo: true,
      }),
    ]);
  });

  it('un id mal escrito o de otro local no trae nada', async () => {
    const ajeno = await sembrar({ otroLocal: true });
    expect(await insumoPorId(await admin(), 'no-es-un-id')).toBeNull();
    expect(await insumoPorId(await admin(), ajeno.id)).toBeNull();
  });
});

describe('crear y editar insumos', () => {
  it('crea uno y, con un nombre repetido, pide confirmar', async () => {
    const nombre = nombreDeInsumo();
    const creado = await crearInsumo(await admin(), datos(nombre), false);
    if (!creado.ok || creado.datos.estado !== 'creado') throw new Error('No se creo');
    insumos.push(creado.datos.id);
    expect(await crearInsumo(await admin(), datos(nombre.toLowerCase()), false)).toEqual({
      ok: true,
      datos: { estado: 'confirmar', nombre },
    });
  });

  it('edita, desactiva y reactiva', async () => {
    const insumo = await sembrar();
    const cliente = await admin();
    expect((await editarInsumo(cliente, insumo.id, datos('Manteca'))).ok).toBe(true);
    expect((await cambiarEstadoDeInsumo(cliente, insumo.id, false)).ok).toBe(true);
    expect(await filaDe('insumos', insumo.id)).toMatchObject({ nombre: 'Manteca', activo: false });
    expect((await cambiarEstadoDeInsumo(cliente, insumo.id, true)).ok).toBe(true);
  });

  it('caja no crea, y uno de otro local no se edita', async () => {
    const ajeno = await sembrar({ otroLocal: true });
    expect(await crearInsumo(await clienteComo('caja'), datos(nombreDeInsumo()), true)).toEqual({
      ok: false,
      mensaje: 'No tenés permiso para hacer esto.',
    });
    expect(await editarInsumo(await admin(), ajeno.id, datos('Robado'))).toEqual({
      ok: false,
      mensaje: 'Ese insumo ya no está disponible. Recargá la página.',
    });
  });
});

describe('formas de compra', () => {
  it('crea una, la edita y la desactiva', async () => {
    const insumo = await sembrar();
    const cliente = await admin();
    const creada = await crearFormaDeCompra(cliente, insumo.id, FORMA);
    if (!creada.ok) throw new Error(creada.mensaje);
    const id = creada.datos.id;
    await editarFormaDeCompra(cliente, id, { ...FORMA, contenido: '50.000', precio: '60.000' });
    expect((await cambiarEstadoDeForma(cliente, id, false)).ok).toBe(true);
    expect(await filaDe('formas_de_compra', id)).toMatchObject({
      contenido: 50000,
      precio_referencia_centavos: 6_000_000,
      activo: false,
    });
  });

  it('a un insumo desactivado no se le agregan formas', async () => {
    const apagado = await sembrar({ activo: false });
    expect(await crearFormaDeCompra(await admin(), apagado.id, FORMA)).toEqual({
      ok: false,
      mensaje: 'Reactivá primero el insumo.',
    });
  });

  it('un proveedor de otro local no se acepta', async () => {
    const insumo = await sembrar();
    const ajeno = await sembrarProveedor({ otroLocal: true });
    proveedores.push(ajeno.id);
    const alta = await crearFormaDeCompra(await admin(), insumo.id, {
      ...FORMA,
      proveedorId: ajeno.id,
    });
    expect(alta).toEqual({
      ok: false,
      mensaje: 'Ese insumo o ese proveedor ya no está disponible. Recargá la página.',
    });
  });
});

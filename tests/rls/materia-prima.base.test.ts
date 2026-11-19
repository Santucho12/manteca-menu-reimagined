import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearClienteSinSesion } from '../../src/lib/supabase/sin-sesion';
import { clienteSecretoDePruebas } from '../clientes';
import type { RolDePrueba } from '../cuentas';
import { asegurarLocalB } from '../locales';
import {
  borrarInsumos,
  filaDe,
  nombreDeInsumo,
  sembrarFormaDeCompra,
  sembrarInsumo,
  type InsumoSembrado,
} from '../materia-prima-de-prueba';
import { clienteComo } from '../sesiones';

const SIN_PERMISO: RolDePrueba[] = [
  'invitado',
  'caja',
  'encargado',
  'desactivado',
  'adminOtroLocal',
];
const TABLAS = ['insumos', 'formas_de_compra'] as const;
const creados: string[] = [];
let delLocal: InsumoSembrado;
let deOtroLocal: InsumoSembrado;
const formas: Record<'delLocal' | 'deOtroLocal', string> = { delLocal: '', deOtroLocal: '' };

beforeAll(async () => {
  delLocal = await sembrarInsumo();
  deOtroLocal = await sembrarInsumo({ otroLocal: true });
  creados.push(delLocal.id, deOtroLocal.id);
  formas.delLocal = await sembrarFormaDeCompra({
    insumoId: delLocal.id,
    localId: delLocal.local_id,
  });
  formas.deOtroLocal = await sembrarFormaDeCompra({
    insumoId: deOtroLocal.id,
    localId: deOtroLocal.local_id,
  });
});

afterAll(() => borrarInsumos(creados));

async function idsQueVe(rol: RolDePrueba, tabla: (typeof TABLAS)[number]): Promise<string[]> {
  const { data, error } = await (await clienteComo(rol)).from(tabla).select('id');
  expect(error).toBeNull();
  return (data ?? []).map((fila) => fila.id);
}

describe('RLS de materia prima: lectura', () => {
  it('el admin ve los insumos y formas de su local y no los de otro', async () => {
    expect(await idsQueVe('admin', 'insumos')).toContain(delLocal.id);
    expect(await idsQueVe('admin', 'insumos')).not.toContain(deOtroLocal.id);
    expect(await idsQueVe('admin', 'formas_de_compra')).toContain(formas.delLocal);
    expect(await idsQueVe('admin', 'formas_de_compra')).not.toContain(formas.deOtroLocal);
  });

  it.each(SIN_PERMISO.filter((rol) => rol !== 'adminOtroLocal'))('%s no ve nada', async (rol) => {
    for (const tabla of TABLAS) expect(await idsQueVe(rol, tabla)).toEqual([]);
  });

  it.each(TABLAS)('el visitante no puede leer %s', async (tabla) => {
    const { data, error } = await crearClienteSinSesion().from(tabla).select('id');
    expect(error?.code).toBe('42501');
    expect(data).toBeNull();
  });

  it('el visitante no puede pedir el costo de los insumos', async () => {
    const { error } = await crearClienteSinSesion().rpc('costo_de_insumos');
    expect(error?.code).toBe('42501');
  });

  it.each(SIN_PERMISO)('%s no recibe el costo de este local', async (rol) => {
    const { data, error } = await (await clienteComo(rol)).rpc('costo_de_insumos');
    expect(error).toBeNull();
    expect((data ?? []).map((fila) => fila.insumo_id)).not.toContain(delLocal.id);
  });
});

describe('RLS de materia prima: escritura', () => {
  it('el admin carga un insumo y su forma de compra, en su local', async () => {
    const admin = await clienteComo('admin');
    const { data, error } = await admin
      .from('insumos')
      .insert({ nombre: nombreDeInsumo(), unidad_de_uso: 'ml' })
      .select('id, local_id')
      .single();
    expect(error).toBeNull();
    creados.push(data!.id);
    expect(data!.local_id).toBe(delLocal.local_id);
    const forma = await admin
      .from('formas_de_compra')
      .insert({ insumo_id: data!.id, como_se_compra: 'Bidón de 5 l', contenido: 5000 })
      .select('local_id')
      .single();
    expect(forma.error).toBeNull();
    expect(forma.data!.local_id).toBe(delLocal.local_id);
  });

  it('no puede mandar el local: lo carga la sesion', async () => {
    const otro = await asegurarLocalB(clienteSecretoDePruebas());
    const { error } = await (
      await clienteComo('admin')
    )
      .from('insumos')
      .insert({ nombre: nombreDeInsumo(), unidad_de_uso: 'g', local_id: otro });
    expect(error?.code).toBe('42501');
  });

  it('el admin cambia y desactiva un insumo y una forma de compra', async () => {
    const admin = await clienteComo('admin');
    const insumo = await sembrarInsumo();
    creados.push(insumo.id);
    const forma = await sembrarFormaDeCompra({ insumoId: insumo.id, localId: insumo.local_id });
    await admin
      .from('insumos')
      .update({ nombre: 'Harina 0000', activo: false })
      .eq('id', insumo.id);
    await admin
      .from('formas_de_compra')
      .update({ precio_referencia_centavos: 3_500_000, activo: false })
      .eq('id', forma);
    expect(await filaDe('insumos', insumo.id)).toMatchObject({
      nombre: 'Harina 0000',
      activo: false,
    });
    expect(await filaDe('formas_de_compra', forma)).toMatchObject({
      precio_referencia_centavos: 3_500_000,
      activo: false,
    });
  });

  it('una forma de compra no se pasa a otro insumo', async () => {
    const otro = await sembrarInsumo();
    creados.push(otro.id);
    const { error } = await (
      await clienteComo('admin')
    )
      .from('formas_de_compra')
      .update({ insumo_id: otro.id })
      .eq('id', formas.delLocal);
    expect(error?.code).toBe('42501');
  });

  it.each(TABLAS)('nadie borra en %s', async (tabla) => {
    const id = tabla === 'insumos' ? delLocal.id : formas.delLocal;
    const { error } = await (await clienteComo('admin')).from(tabla).delete().eq('id', id);
    expect(error?.code).toBe('42501');
  });

  it.each(SIN_PERMISO)('%s no cambia los de este local', async (rol) => {
    const cliente = await clienteComo(rol);
    await cliente.from('insumos').update({ nombre: 'Robado' }).eq('id', delLocal.id);
    await cliente.from('formas_de_compra').update({ contenido: 1 }).eq('id', formas.delLocal);
    expect((await filaDe('insumos', delLocal.id)).nombre).toBe(delLocal.nombre);
    expect(Number((await filaDe('formas_de_compra', formas.delLocal)).contenido)).toBe(25000);
  });

  it.each(['invitado', 'caja', 'encargado', 'desactivado'] as const)('%s no carga', async (rol) => {
    const cliente = await clienteComo(rol);
    const alta = await cliente
      .from('insumos')
      .insert({ nombre: nombreDeInsumo(), unidad_de_uso: 'g' });
    expect(alta.error).not.toBeNull();
    const forma = await cliente
      .from('formas_de_compra')
      .insert({ insumo_id: delLocal.id, como_se_compra: 'Bolsa', contenido: 1 });
    expect(forma.error).not.toBeNull();
  });
});

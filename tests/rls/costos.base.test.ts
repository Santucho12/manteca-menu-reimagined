import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearClienteSinSesion } from '../../src/lib/supabase/sin-sesion';
import { SiembraDeCostos, sembrarUnidades } from '../costos-de-prueba';
import type { RolDePrueba } from '../cuentas';
import { clienteComo } from '../sesiones';

const SIN_PERMISO: RolDePrueba[] = [
  'invitado',
  'caja',
  'encargado',
  'desactivado',
  'adminOtroLocal',
];
const TABLAS = [
  'recetas',
  'renglones_de_receta',
  'costos_de_presentacion',
  'configuracion_de_costos',
] as const;
const siembra = new SiembraDeCostos();
let productoId: string;
let insumoId: string;
let unidadId: string;

beforeAll(async () => {
  const { categoria, producto } = await siembra.menu();
  productoId = producto.id;
  unidadId = categoria.presentaciones[0]!.id;
  insumoId = (await siembra.insumo(1_000)).id;
  await sembrarUnidades(categoria, 0, 1);
  const { error } = await (
    await clienteComo('admin')
  ).rpc('recetas_guardar', {
    datos: { producto_id: producto.id, renglones: [{ insumo_id: insumoId, cantidad: 2 }] },
  });
  if (error) throw new Error(error.message);
});

afterAll(() => siembra.borrar());

describe('RLS de costos', () => {
  it('el admin ve la receta y el costo de su local', async () => {
    const admin = await clienteComo('admin');
    const { data } = await admin
      .from('recetas')
      .select('producto_id')
      .eq('producto_id', productoId);
    expect(data).toEqual([{ producto_id: productoId }]);
    const { data: costos } = await admin.rpc('costos_de_productos');
    expect((costos ?? []).find((f) => f.presentacion_id === unidadId)?.costo_centavos).toBe(2_000);
  });

  it.each(SIN_PERMISO)('%s no ve recetas, unidades ni costos', async (rol) => {
    const cliente = await clienteComo(rol);
    for (const tabla of TABLAS) {
      const { data, error } = await cliente.from(tabla).select('id');
      expect(error).toBeNull();
      expect(data).toEqual([]);
    }
    const { data } = await cliente.rpc('costos_de_productos');
    expect((data ?? []).map((f) => f.producto_id)).not.toContain(productoId);
  });

  it.each(TABLAS)('el visitante no lee %s', async (tabla) => {
    const { error } = await crearClienteSinSesion().from(tabla).select('id');
    expect(error?.code).toBe('42501');
  });

  it('el visitante no pide costos ni guarda recetas', async () => {
    const visitante = crearClienteSinSesion();
    expect((await visitante.rpc('costos_de_productos')).error?.code).toBe('42501');
    const datos = { producto_id: productoId, renglones: [] };
    expect((await visitante.rpc('recetas_guardar', { datos })).error?.code).toBe('42501');
  });

  it.each(SIN_PERMISO)('%s no guarda recetas', async (rol) => {
    const datos = { producto_id: productoId, renglones: [{ insumo_id: insumoId, cantidad: 9 }] };
    const { error } = await (await clienteComo(rol)).rpc('recetas_guardar', { datos });
    expect(error).not.toBeNull();
  });

  it('las recetas no se escriben directo: solo con recetas_guardar', async () => {
    const admin = await clienteComo('admin');
    const { error } = await admin.from('recetas').insert({ producto_id: productoId });
    expect(error?.code).toBe('42501');
    const borrar = await admin.from('recetas').delete().eq('producto_id', productoId);
    expect(borrar.error?.code).toBe('42501');
  });

  it('caja no cambia los margenes', async () => {
    const { error } = await (
      await clienteComo('caja')
    )
      .from('configuracion_de_costos')
      .insert({ margen_objetivo_porcentaje: 10, margen_minimo_porcentaje: 5 });
    expect(error).not.toBeNull();
  });
});

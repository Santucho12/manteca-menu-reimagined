import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearClienteSinSesion } from '../../src/lib/supabase/sin-sesion';
import type { RolDePrueba } from '../cuentas';
import {
  borrarMenuDePrueba,
  filaDe,
  sembrarCategoria,
  sembrarProducto,
  type CategoriaSembrada,
  type ProductoSembrado,
} from '../menu-de-prueba';
import { clienteComo } from '../sesiones';

const TABLAS = ['categorias', 'presentaciones', 'productos', 'precios', 'aumentos'] as const;
const SIN_PERMISO: RolDePrueba[] = [
  'invitado',
  'caja',
  'encargado',
  'desactivado',
  'adminOtroLocal',
];

let categoria: CategoriaSembrada;
let producto: ProductoSembrado;

beforeAll(async () => {
  categoria = await sembrarCategoria({ compartidos: [50000] });
  producto = await sembrarProducto(categoria);
});

afterAll(async () => {
  await borrarMenuDePrueba([categoria.id]);
});

async function idsQueVe(rol: RolDePrueba, tabla: (typeof TABLAS)[number]) {
  const { data, error } = await (await clienteComo(rol)).from(tabla).select('id');
  expect(error).toBeNull();
  return (data ?? []).map((fila) => fila.id);
}

describe('RLS del menu: lectura', () => {
  it('el admin activo ve la categoria, sus presentaciones, el producto y los precios', async () => {
    expect(await idsQueVe('admin', 'categorias')).toContain(categoria.id);
    expect(await idsQueVe('admin', 'presentaciones')).toContain(categoria.presentaciones[0]!.id);
    expect(await idsQueVe('admin', 'productos')).toContain(producto.id);
    expect((await idsQueVe('admin', 'precios')).length).toBeGreaterThanOrEqual(2);
  });

  it.each(SIN_PERMISO)('%s no ve nada del menu', async (rol) => {
    for (const tabla of TABLAS) expect(await idsQueVe(rol, tabla), tabla).toEqual([]);
  });

  it('el visitante sin sesion no puede leer las tablas', async () => {
    for (const tabla of TABLAS) {
      const { data, error } = await crearClienteSinSesion().from(tabla).select('id');
      expect(error?.code, tabla).toBe('42501');
      expect(data).toBeNull();
    }
  });
});

describe('RLS del menu: escritura directa', () => {
  it('ni el admin escribe directo en las tablas: todo pasa por las funciones', async () => {
    const admin = await clienteComo('admin');
    const cambio = await admin.from('productos').update({ nombre: 'Otro' }).eq('id', producto.id);
    expect(cambio.error?.code).toBe('42501');
    const alta = await admin
      .from('categorias')
      .insert({ nombre: 'X', icono: '🥐', orden: 0, local_id: categoria.localId });
    expect(alta.error?.code).toBe('42501');
    const baja = await admin.from('precios').delete().eq('producto_id', producto.id);
    expect(baja.error?.code).toBe('42501');
    expect((await filaDe('productos', producto.id)).nombre).toBe(producto.nombre);
  });
});

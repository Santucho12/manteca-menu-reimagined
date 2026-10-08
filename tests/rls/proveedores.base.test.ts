import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearClienteSinSesion } from '../../src/lib/supabase/sin-sesion';
import { clienteSecretoDePruebas } from '../clientes';
import type { RolDePrueba } from '../cuentas';
import { asegurarLocalB, idDelLocalPrincipal } from '../locales';
import {
  borrarProveedores,
  nombreDeProveedor,
  proveedorDe,
  sembrarProveedor,
  type ProveedorSembrado,
} from '../proveedores-de-prueba';
import { clienteComo } from '../sesiones';

const SIN_PERMISO: RolDePrueba[] = [
  'invitado',
  'caja',
  'encargado',
  'desactivado',
  'adminOtroLocal',
];
const creados: string[] = [];
let delLocal: ProveedorSembrado;
let deOtroLocal: ProveedorSembrado;

beforeAll(async () => {
  delLocal = await sembrarProveedor();
  deOtroLocal = await sembrarProveedor({ otroLocal: true });
  creados.push(delLocal.id, deOtroLocal.id);
});

afterAll(() => borrarProveedores(creados));

async function idsQueVe(rol: RolDePrueba): Promise<string[]> {
  const { data, error } = await (await clienteComo(rol)).from('proveedores').select('id');
  expect(error).toBeNull();
  return (data ?? []).map((fila) => fila.id);
}

describe('RLS de proveedores: lectura', () => {
  it('el admin ve los de su local y no los de otro', async () => {
    const ids = await idsQueVe('admin');
    expect(ids).toContain(delLocal.id);
    expect(ids).not.toContain(deOtroLocal.id);
  });

  it.each(SIN_PERMISO.filter((rol) => rol !== 'adminOtroLocal'))('%s no ve nada', async (rol) => {
    expect(await idsQueVe(rol)).toEqual([]);
  });

  it('el visitante no puede leer', async () => {
    const { data, error } = await crearClienteSinSesion().from('proveedores').select('id');
    expect(error?.code).toBe('42501');
    expect(data).toBeNull();
  });
});

describe('RLS de proveedores: escritura', () => {
  it('el admin carga uno y queda en su local, sin elegirlo', async () => {
    const { data, error } = await (
      await clienteComo('admin')
    )
      .from('proveedores')
      .insert({ nombre: nombreDeProveedor() })
      .select('id')
      .single();
    expect(error).toBeNull();
    creados.push(data!.id);
    const local = await idDelLocalPrincipal(clienteSecretoDePruebas());
    expect((await proveedorDe(data!.id)).local_id).toBe(local);
  });

  it('no puede mandar el local: lo carga la sesion', async () => {
    const otro = await asegurarLocalB(clienteSecretoDePruebas());
    const { error } = await (
      await clienteComo('admin')
    )
      .from('proveedores')
      .insert({ nombre: nombreDeProveedor(), local_id: otro });
    expect(error?.code).toBe('42501');
  });

  it('el admin cambia el nombre y lo desactiva', async () => {
    const proveedor = await sembrarProveedor();
    creados.push(proveedor.id);
    const { error } = await (
      await clienteComo('admin')
    )
      .from('proveedores')
      .update({ nombre: 'Molino nuevo', activo: false })
      .eq('id', proveedor.id);
    expect(error).toBeNull();
    expect(await proveedorDe(proveedor.id)).toMatchObject({
      nombre: 'Molino nuevo',
      activo: false,
    });
  });

  it('nadie borra', async () => {
    const { error } = await (
      await clienteComo('admin')
    )
      .from('proveedores')
      .delete()
      .eq('id', delLocal.id);
    expect(error?.code).toBe('42501');
  });

  it.each(SIN_PERMISO)('%s no cambia los de este local', async (rol) => {
    const cliente = await clienteComo(rol);
    await cliente.from('proveedores').update({ nombre: 'Robado' }).eq('id', delLocal.id);
    expect((await proveedorDe(delLocal.id)).nombre).toBe(delLocal.nombre);
  });

  it.each(['invitado', 'caja', 'encargado', 'desactivado'] as const)('%s no carga', async (rol) => {
    const alta = await (
      await clienteComo(rol)
    )
      .from('proveedores')
      .insert({ nombre: nombreDeProveedor() });
    expect(alta.error).not.toBeNull();
  });

  it('el admin de otro local carga, pero en el suyo', async () => {
    const { data } = await (
      await clienteComo('adminOtroLocal')
    )
      .from('proveedores')
      .insert({ nombre: nombreDeProveedor() })
      .select('id')
      .single();
    creados.push(data!.id);
    const otro = await asegurarLocalB(clienteSecretoDePruebas());
    expect((await proveedorDe(data!.id)).local_id).toBe(otro);
  });
});

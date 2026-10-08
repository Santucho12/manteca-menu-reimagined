import { describe, expect, it } from 'vitest';
import { crearClienteSinSesion } from '../../src/lib/supabase/sin-sesion';
import type { RolDePrueba } from '../cuentas';
import { NOMBRE_DEL_LOCAL_B, NOMBRE_DEL_LOCAL_PRINCIPAL } from '../locales';
import { clienteComo } from '../sesiones';

async function localesQueVe(rol: RolDePrueba): Promise<string[]> {
  const { data, error } = await (await clienteComo(rol)).from('locales').select('nombre');
  expect(error).toBeNull();
  expect(data).not.toBeNull();
  return (data ?? []).map((local) => local.nombre);
}

describe('RLS de locales', () => {
  it('el admin activo ve su local', async () => {
    expect(await localesQueVe('admin')).toEqual([NOMBRE_DEL_LOCAL_PRINCIPAL]);
  });

  it.each(['invitado', 'caja', 'encargado', 'desactivado'] as const)(
    '%s no ve ningun local',
    async (rol) => {
      expect(await localesQueVe(rol)).toEqual([]);
    },
  );

  it('el admin de otro local ve solo el suyo', async () => {
    expect(await localesQueVe('adminOtroLocal')).toEqual([NOMBRE_DEL_LOCAL_B]);
  });

  it('el visitante sin sesion no puede leer locales', async () => {
    const { data, error } = await crearClienteSinSesion().from('locales').select('nombre');
    expect(error?.code).toBe('42501');
    expect(data).toBeNull();
  });

  it('nadie puede crear, cambiar ni borrar locales', async () => {
    const admin = await clienteComo('admin');
    const alta = await admin.from('locales').insert({ nombre: 'Otro local' });
    const cambio = await admin
      .from('locales')
      .update({ nombre: 'Cambiado' })
      .eq('nombre', NOMBRE_DEL_LOCAL_PRINCIPAL);
    const baja = await admin.from('locales').delete().eq('nombre', NOMBRE_DEL_LOCAL_PRINCIPAL);
    expect([alta.error?.code, cambio.error?.code, baja.error?.code]).toEqual([
      '42501',
      '42501',
      '42501',
    ]);
  });
});

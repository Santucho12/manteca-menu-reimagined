import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearClienteSinSesion } from '../../src/lib/supabase/sin-sesion';
import type { RolDePrueba } from '../cuentas';
import {
  borrarCuentaTemporal,
  crearCuentaTemporal,
  type CuentaTemporal,
} from '../cuentas-temporales';
import { clienteComo } from '../sesiones';

const SIN_PERMISO: RolDePrueba[] = [
  'invitado',
  'caja',
  'encargado',
  'desactivado',
  'adminOtroLocal',
];

describe('RLS de auditoria', () => {
  // Al crearse, la cuenta deja su alta en la auditoria del local A.
  let cuenta: CuentaTemporal;

  beforeAll(async () => {
    cuenta = await crearCuentaTemporal();
  });

  afterAll(async () => {
    await borrarCuentaTemporal(cuenta.id);
  });

  async function registrosQueVe(rol: RolDePrueba) {
    const { data, error } = await (
      await clienteComo(rol)
    )
      .from('auditoria')
      .select('accion')
      .eq('registro_id', cuenta.id);
    expect(error).toBeNull();
    return data;
  }

  it('el admin activo ve la auditoria de su local', async () => {
    expect((await registrosQueVe('admin'))?.length).toBeGreaterThan(0);
  });

  it.each(SIN_PERMISO)('%s no ve esa auditoria', async (rol) => {
    expect(await registrosQueVe(rol)).toEqual([]);
  });

  it('el visitante sin sesion no puede leer la auditoria', async () => {
    const { data, error } = await crearClienteSinSesion().from('auditoria').select('accion');
    expect(error?.code).toBe('42501');
    expect(data).toBeNull();
  });

  it('nadie puede escribir, cambiar ni borrar la auditoria', async () => {
    const admin = await clienteComo('admin');
    const alta = await admin
      .from('auditoria')
      .insert({ tabla: 'x', registro_id: 'x', accion: 'alta' });
    const cambio = await admin
      .from('auditoria')
      .update({ motivo: 'x' })
      .eq('registro_id', cuenta.id);
    const baja = await admin.from('auditoria').delete().eq('registro_id', cuenta.id);
    expect([alta.error?.code, cambio.error?.code, baja.error?.code]).toEqual([
      '42501',
      '42501',
      '42501',
    ]);
  });
});

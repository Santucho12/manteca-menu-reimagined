import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { crearClienteSinSesion } from '../../src/lib/supabase/sin-sesion';
import { clienteSecretoDePruebas } from '../clientes';
import { idDeCuentaDePrueba, perfilDe } from '../consultas-de-prueba';
import { emailDePrueba, type RolDePrueba } from '../cuentas';
import {
  borrarCuentaTemporal,
  crearCuentaTemporal,
  type CuentaTemporal,
} from '../cuentas-temporales';
import { clienteComo } from '../sesiones';

const DEL_LOCAL_A: RolDePrueba[] = ['invitado', 'caja', 'encargado', 'admin', 'desactivado'];
const SIN_PERMISO: RolDePrueba[] = [
  'invitado',
  'caja',
  'encargado',
  'desactivado',
  'adminOtroLocal',
];

async function emailsQueVe(rol: RolDePrueba): Promise<string[]> {
  const { data, error } = await (await clienteComo(rol)).from('perfiles').select('email');
  expect(error).toBeNull();
  expect(data).not.toBeNull();
  return (data ?? []).map((perfil) => perfil.email);
}

describe('RLS de perfiles: lectura', () => {
  it('el admin activo ve los perfiles de su local y no los de otro', async () => {
    const emails = await emailsQueVe('admin');
    for (const rol of DEL_LOCAL_A) expect(emails).toContain(emailDePrueba(rol).toLowerCase());
    expect(emails).not.toContain(emailDePrueba('adminOtroLocal').toLowerCase());
  });

  it.each(['invitado', 'caja', 'encargado', 'desactivado'] as const)(
    '%s ve solo su propio perfil',
    async (rol) => {
      expect(await emailsQueVe(rol)).toEqual([emailDePrueba(rol).toLowerCase()]);
    },
  );

  it('el admin de otro local no ve los perfiles del local A', async () => {
    const emails = await emailsQueVe('adminOtroLocal');
    for (const rol of DEL_LOCAL_A) expect(emails).not.toContain(emailDePrueba(rol).toLowerCase());
  });

  it('el visitante sin sesion no puede leer perfiles', async () => {
    const { data, error } = await crearClienteSinSesion().from('perfiles').select('email');
    expect(error?.code).toBe('42501');
    expect(data).toBeNull();
  });
});

describe('RLS de perfiles: escritura', () => {
  let cuenta: CuentaTemporal;

  beforeAll(async () => {
    cuenta = await crearCuentaTemporal({ rol: 'caja' });
  });

  afterAll(async () => {
    await borrarCuentaTemporal(cuenta.id);
  });

  beforeEach(async () => {
    const original = { rol: 'caja' as const, activo: true, nombre: 'Cuenta temporal' };
    await clienteSecretoDePruebas().from('perfiles').update(original).eq('id', cuenta.id);
  });

  it('el admin activo cambia el nombre, el rol y el estado de alguien de su local', async () => {
    const { data, error } = await (
      await clienteComo('admin')
    )
      .from('perfiles')
      .update({ nombre: 'Otro nombre', rol: 'admin', activo: false })
      .eq('id', cuenta.id)
      .select('nombre, rol, activo');
    expect(error).toBeNull();
    expect(data).toEqual([{ nombre: 'Otro nombre', rol: 'admin', activo: false }]);
  });

  it.each(SIN_PERMISO)('%s no puede cambiarle el rol a otra cuenta', async (rol) => {
    await (await clienteComo(rol)).from('perfiles').update({ rol: 'admin' }).eq('id', cuenta.id);
    expect((await perfilDe(cuenta.id)).rol).toBe('caja');
  });

  it('caja no puede darse el rol de admin', async () => {
    const id = await idDeCuentaDePrueba('caja');
    await (await clienteComo('caja')).from('perfiles').update({ rol: 'admin' }).eq('id', id);
    expect((await perfilDe(id)).rol).toBe('caja');
  });

  it('nadie puede crear ni borrar perfiles', async () => {
    const admin = await clienteComo('admin');
    const datos = { id: cuenta.id, local_id: cuenta.id, nombre: 'x', email: 'x@manteca.test' };
    const alta = await admin.from('perfiles').insert(datos);
    const baja = await admin.from('perfiles').delete().eq('id', cuenta.id);
    expect([alta.error?.code, baja.error?.code]).toEqual(['42501', '42501']);
    expect((await perfilDe(cuenta.id)).email).toBe(cuenta.email);
  });

  it('el admin no puede tocar el email, el local ni el cambio obligado', async () => {
    const admin = await clienteComo('admin');
    const cambios = [
      { email: 'otro@manteca.test' },
      { local_id: cuenta.id },
      { debe_cambiar_contrasena: true },
    ];
    for (const cambio of cambios) {
      const { error } = await admin.from('perfiles').update(cambio).eq('id', cuenta.id);
      expect(error?.code).toBe('42501');
    }
  });
});

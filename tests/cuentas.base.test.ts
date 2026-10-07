import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { leerEntornoPublico } from '../src/lib/entorno/publico';
import { clienteComo, clienteSecretoDePruebas } from './clientes';
import {
  ROLES_DE_PRUEBA,
  emailDePrueba,
  listarCuentas,
  sembrarCuentas,
  type RolDePrueba,
} from './cuentas';
import { leerEntornoPruebas } from './entorno-pruebas';

async function idDeLaCuenta(secreto: SupabaseClient, rol: RolDePrueba): Promise<string> {
  const { data, error } = await secreto.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(`No pude listar las cuentas: ${error.message}`);
  const cuenta = data.users.find((usuario) => usuario.email === emailDePrueba(rol).toLowerCase());
  if (!cuenta) throw new Error(`No existe la cuenta de ${rol}`);
  return cuenta.id;
}

describe('cuentas de prueba', () => {
  it('son seis, una por rol', () => {
    expect(ROLES_DE_PRUEBA).toEqual([
      'invitado',
      'caja',
      'encargado',
      'admin',
      'adminOtroLocal',
      'desactivado',
    ]);
  });

  it.each(ROLES_DE_PRUEBA)('la cuenta de %s inicia sesion con la clave publicable', async (rol) => {
    const cliente = await clienteComo(rol);
    const { data, error } = await cliente.auth.getUser();
    expect(error).toBeNull();
    // Supabase guarda el email en minusculas.
    expect(data.user?.email).toBe(emailDePrueba(rol).toLowerCase());
  });

  it('sembrar de nuevo no crea cuentas ni falla', async () => {
    const { CONTRASENA_USUARIOS_PRUEBA } = leerEntornoPruebas();
    const creadas = await sembrarCuentas(clienteSecretoDePruebas(), CONTRASENA_USUARIOS_PRUEBA);
    expect(creadas).toEqual([]);
  });

  it('sembrar repara una cuenta que quedo con otra contraseña', async () => {
    const secreto = clienteSecretoDePruebas();
    const { CONTRASENA_USUARIOS_PRUEBA } = leerEntornoPruebas();
    const id = await idDeLaCuenta(secreto, 'caja');
    await secreto.auth.admin.updateUserById(id, { password: 'una-contraseña-vieja' });
    try {
      await sembrarCuentas(secreto, CONTRASENA_USUARIOS_PRUEBA);
      await expect(clienteComo('caja')).resolves.toBeTruthy();
    } finally {
      // Pase lo que pase, la cuenta vuelve a la contraseña de .env.local.
      await secreto.auth.admin.updateUserById(id, { password: CONTRASENA_USUARIOS_PRUEBA });
    }
  });

  it('listarCuentas trae todas las cuentas aunque ocupen varias paginas', async () => {
    const secreto = clienteSecretoDePruebas();
    const deUnaPagina = await listarCuentas(secreto);
    const deADos = await listarCuentas(secreto, 2);
    expect(deUnaPagina.length).toBeGreaterThan(2);
    expect(deADos.map((cuenta) => cuenta.id).sort()).toEqual(
      deUnaPagina.map((cuenta) => cuenta.id).sort(),
    );
  });

  it('una contraseña equivocada no entra', async () => {
    const entorno = leerEntornoPublico();
    const cliente = createClient(
      entorno.NEXT_PUBLIC_SUPABASE_URL,
      entorno.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data, error } = await cliente.auth.signInWithPassword({
      email: emailDePrueba('admin'),
      password: 'no-es-la-contraseña',
    });
    expect(error).not.toBeNull();
    expect(data.session).toBeNull();
  });
});

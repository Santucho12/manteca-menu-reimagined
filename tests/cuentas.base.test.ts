import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { leerEntornoPublico } from '../src/lib/entorno/publico';
import { clienteComo, clienteSecretoDePruebas } from './clientes';
import { ROLES_DE_PRUEBA, emailDePrueba, sembrarCuentas } from './cuentas';
import { leerEntornoPruebas } from './entorno-pruebas';

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

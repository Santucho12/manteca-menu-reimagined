import { randomUUID } from 'node:crypto';
import type { User } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import type { Cliente } from '../src/lib/supabase/cliente';
import { crearClienteSinSesion } from '../src/lib/supabase/sin-sesion';
import { clienteSecretoDePruebas } from './clientes';
import {
  ROLES_DE_PRUEBA,
  asegurarContrasenaDeSiembra,
  emailDePrueba,
  listarCuentas,
  sembrarCuentas,
} from './cuentas';
import { leerEntornoPruebas } from './entorno-pruebas';
import { iniciarSesion } from './iniciar-sesion';
import { clienteComo } from './sesiones';

async function usuario(secreto: Cliente, id: string): Promise<User> {
  const { data, error } = await secreto.auth.admin.getUserById(id);
  if (error || !data.user) throw new Error(`No encontré la cuenta ${id}: ${error?.message}`);
  return data.user;
}

async function crearDescartable(secreto: Cliente, email: string): Promise<string> {
  const { data, error } = await secreto.auth.admin.createUser({
    email,
    password: 'una-vieja-larga',
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`No pude crear la cuenta ${email}: ${error?.message}`);
  return data.user.id;
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

  it.each(ROLES_DE_PRUEBA)('la sesion de %s es la de su cuenta', async (rol) => {
    const { data, error } = await (await clienteComo(rol)).auth.getUser();
    expect(error).toBeNull();
    // Supabase guarda el email en minusculas.
    expect(data.user?.email).toBe(emailDePrueba(rol).toLowerCase());
  });

  it('sembrar de nuevo no crea cuentas ni falla', async () => {
    const { CONTRASENA_USUARIOS_PRUEBA } = leerEntornoPruebas();
    expect(await sembrarCuentas(clienteSecretoDePruebas(), CONTRASENA_USUARIOS_PRUEBA)).toEqual([]);
  });

  it('sembrar de nuevo no cierra las sesiones abiertas de las cuentas de prueba', async () => {
    const { CONTRASENA_USUARIOS_PRUEBA } = leerEntornoPruebas();
    const caja = await iniciarSesion(emailDePrueba('caja'), CONTRASENA_USUARIOS_PRUEBA);
    await sembrarCuentas(clienteSecretoDePruebas(), CONTRASENA_USUARIOS_PRUEBA);
    expect((await caja.auth.getUser()).error).toBeNull();
  });

  it('la siembra cambia la contraseña solo cuando cambio la de .env.local', async () => {
    const secreto = clienteSecretoDePruebas();
    const email = `siembra.${randomUUID()}@manteca.test`;
    const id = await crearDescartable(secreto, email);
    try {
      await asegurarContrasenaDeSiembra(secreto, await usuario(secreto, id), 'una-nueva-larga');
      const abierta = await iniciarSesion(email, 'una-nueva-larga');
      await asegurarContrasenaDeSiembra(secreto, await usuario(secreto, id), 'una-nueva-larga');
      expect((await abierta.auth.getUser()).error).toBeNull();
    } finally {
      await secreto.auth.admin.deleteUser(id);
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
    const { data, error } = await crearClienteSinSesion().auth.signInWithPassword({
      email: emailDePrueba('admin'),
      password: 'no-es-la-contraseña',
    });
    expect(error).not.toBeNull();
    expect(data.session).toBeNull();
  });
});

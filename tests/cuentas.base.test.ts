import { describe, expect, it } from 'vitest';
import { crearClienteSinSesion } from '../src/lib/supabase/sin-sesion';
import { clienteSecretoDePruebas } from './clientes';
import { registrosDe, usuarioDe } from './consultas-de-prueba';
import {
  PERFILES_DE_PRUEBA,
  ROLES_DE_PRUEBA,
  asegurarContrasenaDeSiembra,
  emailDePrueba,
  listarCuentas,
  sembrarCuentas,
} from './cuentas';
import { borrarCuentaTemporal, crearCuentaTemporal } from './cuentas-temporales';
import { leerEntornoPruebas } from './entorno-pruebas';
import { iniciarSesion } from './iniciar-sesion';
import { NOMBRE_DEL_LOCAL_B, NOMBRE_DEL_LOCAL_PRINCIPAL } from './locales';
import { clienteComo } from './sesiones';

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
    expect(data.user?.email).toBe(emailDePrueba(rol).toLowerCase());
  });

  it('cada cuenta de prueba queda con su nombre, rol, local y estado', async () => {
    const { data, error } = await clienteSecretoDePruebas()
      .from('perfiles')
      .select('email, nombre, rol, activo, debe_cambiar_contrasena, locales(nombre)')
      .in(
        'email',
        ROLES_DE_PRUEBA.map((rol) => emailDePrueba(rol).toLowerCase()),
      );
    expect(error).toBeNull();
    const porEmail = new Map((data ?? []).map((perfil) => [perfil.email, perfil]));
    for (const rol of ROLES_DE_PRUEBA) {
      const { nombre, rol: rolDeLaBase, activo, otroLocal } = PERFILES_DE_PRUEBA[rol];
      expect(porEmail.get(emailDePrueba(rol).toLowerCase())).toEqual({
        email: emailDePrueba(rol).toLowerCase(),
        nombre,
        rol: rolDeLaBase,
        activo,
        debe_cambiar_contrasena: false,
        locales: { nombre: otroLocal ? NOMBRE_DEL_LOCAL_B : NOMBRE_DEL_LOCAL_PRINCIPAL },
      });
    }
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
    const cuenta = await crearCuentaTemporal();
    try {
      await asegurarContrasenaDeSiembra(
        secreto,
        await usuarioDe(cuenta.id),
        'una-contraseña-nueva',
      );
      await expect(iniciarSesion(cuenta.email, 'una-contraseña-nueva')).resolves.toBeTruthy();
      const cambios = async () =>
        (await registrosDe(cuenta.id)).filter((r) => r.accion === 'cambio_de_contrasena').length;
      const antes = await cambios();
      await asegurarContrasenaDeSiembra(
        secreto,
        await usuarioDe(cuenta.id),
        'una-contraseña-nueva',
      );
      expect(await cambios()).toBe(antes);
    } finally {
      await borrarCuentaTemporal(cuenta.id);
    }
  });

  it('listarCuentas trae todas las cuentas aunque ocupen varias paginas', async () => {
    const secreto = clienteSecretoDePruebas();
    const deUnaPagina = await listarCuentas(secreto);
    const deADos = await listarCuentas(secreto, 2);
    expect(deUnaPagina.length).toBeGreaterThan(2);
    expect(deADos.map((c) => c.id).sort()).toEqual(deUnaPagina.map((c) => c.id).sort());
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

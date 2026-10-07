import { describe, expect, it } from 'vitest';
import { exito, fallo } from '../../src/lib/resultado';
import { crearClienteSinSesion } from '../../src/lib/supabase/sin-sesion';
import { asignarRol, desactivar, reactivar } from '../../src/lib/usuarios/administracion';
import { MENSAJES } from '../../src/lib/usuarios/errores';
import { clienteSecretoDePruebas } from '../clientes';
import { idDeCuentaDePrueba, perfilDe, registrosDe, usuarioDe } from '../consultas-de-prueba';
import type { RolDePrueba } from '../cuentas';
import {
  borrarCuentaTemporal,
  crearCuentaTemporal,
  type CuentaTemporal,
  type OpcionesDeCuenta,
} from '../cuentas-temporales';
import { iniciarSesion } from '../iniciar-sesion';
import { clienteComo } from '../sesiones';

const OK = exito(undefined);
const SIN_PERMISO: RolDePrueba[] = ['invitado', 'caja', 'encargado', 'desactivado'];

async function conCuenta(
  opciones: OpcionesDeCuenta,
  prueba: (cuenta: CuentaTemporal) => Promise<void>,
) {
  const cuenta = await crearCuentaTemporal(opciones);
  try {
    await prueba(cuenta);
  } finally {
    await borrarCuentaTemporal(cuenta.id);
  }
}

describe('asignarRol', () => {
  it('el admin le da el rol de Caja a quien espera, y queda en la auditoria', () =>
    conCuenta({}, async (cuenta) => {
      const admin = await idDeCuentaDePrueba('admin');
      expect(await asignarRol(await clienteComo('admin'), { id: cuenta.id, rol: 'caja' })).toEqual(
        OK,
      );
      expect((await perfilDe(cuenta.id)).rol).toBe('caja');
      expect(await registrosDe(cuenta.id)).toContainEqual({
        accion: 'cambio',
        usuario_id: admin,
        antes: { rol: 'invitado' },
        despues: { rol: 'caja' },
      });
    }));

  it.each(SIN_PERMISO)('%s no puede asignar roles', (rol) =>
    conCuenta({}, async (cuenta) => {
      const resultado = await asignarRol(await clienteComo(rol), { id: cuenta.id, rol: 'admin' });
      expect(resultado).toEqual(fallo(MENSAJES.sinPermiso));
      expect((await perfilDe(cuenta.id)).rol).toBe('invitado');
    }),
  );

  it('sin sesion no puede asignar roles', () =>
    conCuenta({}, async (cuenta) => {
      const resultado = await asignarRol(crearClienteSinSesion(), { id: cuenta.id, rol: 'admin' });
      expect(resultado).toEqual(fallo(MENSAJES.sinPermiso));
    }));

  it('el admin de otro local no encuentra la cuenta', () =>
    conCuenta({}, async (cuenta) => {
      const otro = await clienteComo('adminOtroLocal');
      expect(await asignarRol(otro, { id: cuenta.id, rol: 'caja' })).toEqual(
        fallo(MENSAJES.cuentaNoEncontrada),
      );
      expect((await perfilDe(cuenta.id)).rol).toBe('invitado');
    }));

  it('nadie se cambia el rol a si mismo', () =>
    conCuenta({ rol: 'admin' }, async (cuenta) => {
      const propio = await iniciarSesion(cuenta.email, cuenta.contrasena);
      expect(await asignarRol(propio, { id: cuenta.id, rol: 'caja' })).toEqual(
        fallo(MENSAJES.noASiMismo),
      );
    }));
});

describe('desactivar y reactivar', () => {
  it('desactivar bloquea la cuenta: no entra aunque sepa la contraseña', () =>
    conCuenta({ rol: 'caja' }, async (cuenta) => {
      const admin = await clienteComo('admin');
      expect(await desactivar(admin, clienteSecretoDePruebas(), cuenta.id)).toEqual(OK);
      expect((await perfilDe(cuenta.id)).activo).toBe(false);
      expect((await usuarioDe(cuenta.id)).banned_until).toBeTruthy();
      await expect(iniciarSesion(cuenta.email, cuenta.contrasena)).rejects.toThrow();
    }));

  it('reactivar le devuelve el acceso con el rol que tenia', () =>
    conCuenta({ rol: 'caja', activo: false }, async (cuenta) => {
      const secreto = clienteSecretoDePruebas();
      await secreto.auth.admin.updateUserById(cuenta.id, { ban_duration: '876000h' });
      expect(await reactivar(await clienteComo('admin'), secreto, cuenta.id)).toEqual(OK);
      expect(await perfilDe(cuenta.id)).toMatchObject({ rol: 'caja', activo: true });
      await expect(iniciarSesion(cuenta.email, cuenta.contrasena)).resolves.toBeTruthy();
    }));

  it.each(SIN_PERMISO)('%s no puede desactivar a nadie', (rol) =>
    conCuenta({ rol: 'caja' }, async (cuenta) => {
      const resultado = await desactivar(
        await clienteComo(rol),
        clienteSecretoDePruebas(),
        cuenta.id,
      );
      expect(resultado).toEqual(fallo(MENSAJES.sinPermiso));
      expect((await usuarioDe(cuenta.id)).banned_until).toBeFalsy();
    }),
  );

  it('el admin de otro local no puede desactivar, y la cuenta sigue sin bloquear', () =>
    conCuenta({ rol: 'caja' }, async (cuenta) => {
      const otro = await clienteComo('adminOtroLocal');
      expect(await desactivar(otro, clienteSecretoDePruebas(), cuenta.id)).toEqual(
        fallo(MENSAJES.cuentaNoEncontrada),
      );
      expect((await perfilDe(cuenta.id)).activo).toBe(true);
      expect((await usuarioDe(cuenta.id)).banned_until).toBeFalsy();
    }));

  it('nadie se desactiva a si mismo, y su cuenta no se bloquea', () =>
    conCuenta({ rol: 'admin' }, async (cuenta) => {
      const propio = await iniciarSesion(cuenta.email, cuenta.contrasena);
      expect(await desactivar(propio, clienteSecretoDePruebas(), cuenta.id)).toEqual(
        fallo(MENSAJES.noASiMismo),
      );
      expect((await usuarioDe(cuenta.id)).banned_until).toBeFalsy();
    }));
});

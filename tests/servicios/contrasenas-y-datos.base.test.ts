import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { exito, fallo } from '../../src/lib/resultado';
import { corregir, resetearContrasena } from '../../src/lib/usuarios/administracion';
import { MENSAJES } from '../../src/lib/usuarios/errores';
import { clienteSecretoDePruebas } from '../clientes';
import { accionesSinUsar, idDeCuentaDePrueba, perfilDe, registrosDe } from '../consultas-de-prueba';
import { emailDePrueba, type RolDePrueba } from '../cuentas';
import {
  borrarCuentaTemporal,
  crearCuentaTemporal,
  type CuentaTemporal,
  type OpcionesDeCuenta,
} from '../cuentas-temporales';
import { iniciarSesion } from '../iniciar-sesion';
import { clienteComo } from '../sesiones';

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

describe('resetearContrasena', () => {
  it('el admin genera una temporal que sirve para entrar y obliga a cambiarla', () =>
    conCuenta({ rol: 'caja' }, async (cuenta) => {
      const admin = await clienteComo('admin');
      const resultado = await resetearContrasena(admin, clienteSecretoDePruebas(), cuenta.id);
      if (!resultado.ok) throw new Error(resultado.mensaje);
      expect(resultado.datos.temporal).toMatch(/^[A-HJ-NP-Za-km-np-z2-9]{12}$/);
      expect(resultado.datos.nombre).toBe('Cuenta temporal');
      await expect(iniciarSesion(cuenta.email, resultado.datos.temporal)).resolves.toBeTruthy();
      expect((await perfilDe(cuenta.id)).debe_cambiar_contrasena).toBe(true);
      expect(await registrosDe(cuenta.id)).toContainEqual(
        expect.objectContaining({
          accion: 'reseteo_de_contrasena',
          usuario_id: await idDeCuentaDePrueba('admin'),
        }),
      );
    }));

  it('un admin no resetea su propia contraseña', () =>
    conCuenta({ rol: 'admin' }, async (cuenta) => {
      const propio = await iniciarSesion(cuenta.email, cuenta.contrasena);
      expect(await resetearContrasena(propio, clienteSecretoDePruebas(), cuenta.id)).toEqual(
        fallo(MENSAJES.propiaContrasena),
      );
    }));

  it('el admin de otro local no puede, y la contraseña sigue siendo la misma', () =>
    conCuenta({ rol: 'caja' }, async (cuenta) => {
      const otro = await clienteComo('adminOtroLocal');
      expect(await resetearContrasena(otro, clienteSecretoDePruebas(), cuenta.id)).toEqual(
        fallo(MENSAJES.cuentaNoEncontrada),
      );
      await expect(iniciarSesion(cuenta.email, cuenta.contrasena)).resolves.toBeTruthy();
      expect(await accionesSinUsar(cuenta.id)).toBe(0);
    }));

  it.each(SIN_PERMISO)('%s no puede resetear', (rol) =>
    conCuenta({ rol: 'caja' }, async (cuenta) => {
      const resultado = await resetearContrasena(
        await clienteComo(rol),
        clienteSecretoDePruebas(),
        cuenta.id,
      );
      expect(resultado).toEqual(fallo(MENSAJES.sinPermiso));
    }),
  );
});

describe('corregir', () => {
  it('el admin corrige el nombre y el email, y los dos cambios quedan a su nombre', () =>
    conCuenta({ rol: 'caja' }, async (cuenta) => {
      const admin = await idDeCuentaDePrueba('admin');
      const email = `corregido.${randomUUID()}@manteca.test`;
      const datos = { id: cuenta.id, nombre: 'Nombre corregido', email };
      expect(await corregir(await clienteComo('admin'), clienteSecretoDePruebas(), datos)).toEqual(
        exito(undefined),
      );
      expect(await perfilDe(cuenta.id)).toMatchObject({ nombre: 'Nombre corregido', email });
      const registros = await registrosDe(cuenta.id);
      expect(registros).toContainEqual({
        accion: 'cambio',
        usuario_id: admin,
        antes: { nombre: 'Cuenta temporal' },
        despues: { nombre: 'Nombre corregido' },
      });
      expect(registros).toContainEqual({
        accion: 'cambio',
        usuario_id: admin,
        antes: { email: cuenta.email },
        despues: { email },
      });
    }));

  it('un email que ya usa otra cuenta no se acepta y no deja nada anotado', () =>
    conCuenta({ rol: 'caja' }, async (cuenta) => {
      const datos = { id: cuenta.id, nombre: 'Cuenta temporal', email: emailDePrueba('invitado') };
      expect(await corregir(await clienteComo('admin'), clienteSecretoDePruebas(), datos)).toEqual(
        fallo(MENSAJES.emailExistente),
      );
      expect(await accionesSinUsar(cuenta.id)).toBe(0);
    }));

  it('el admin de otro local no puede corregir', () =>
    conCuenta({ rol: 'caja' }, async (cuenta) => {
      const datos = { id: cuenta.id, nombre: 'Otro nombre', email: cuenta.email };
      const otro = await clienteComo('adminOtroLocal');
      expect(await corregir(otro, clienteSecretoDePruebas(), datos)).toEqual(
        fallo(MENSAJES.cuentaNoEncontrada),
      );
      expect((await perfilDe(cuenta.id)).nombre).toBe('Cuenta temporal');
    }));

  it.each(SIN_PERMISO)('%s no puede corregir, y el email sigue igual', (rol) =>
    conCuenta({ rol: 'caja' }, async (cuenta) => {
      const datos = { id: cuenta.id, nombre: 'Otro nombre', email: `otro.${cuenta.email}` };
      expect(await corregir(await clienteComo(rol), clienteSecretoDePruebas(), datos)).toEqual(
        fallo(MENSAJES.sinPermiso),
      );
      expect(await perfilDe(cuenta.id)).toMatchObject({
        nombre: 'Cuenta temporal',
        email: cuenta.email,
      });
      expect(await accionesSinUsar(cuenta.id)).toBe(0);
    }),
  );
});

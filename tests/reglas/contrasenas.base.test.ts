import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { clienteSecretoDePruebas } from '../clientes';
import { anotarAccion, idDeCuentaDePrueba, perfilDe, registrosDe } from '../consultas-de-prueba';
import { borrarCuentaTemporal, crearCuentaTemporal } from '../cuentas-temporales';
import { iniciarSesion } from '../iniciar-sesion';

const ONCE_MINUTOS_ATRAS = () => new Date(Date.now() - 11 * 60_000).toISOString();

function ponerContrasena(id: string, password: string) {
  return clienteSecretoDePruebas().auth.admin.updateUserById(id, { password });
}

function cambiarEmail(id: string, email: string) {
  return clienteSecretoDePruebas().auth.admin.updateUserById(id, { email, email_confirm: true });
}

describe('contraseñas y email de las cuentas', () => {
  it('un reseteo prende el cambio obligado y queda a nombre del admin', async () => {
    const cuenta = await crearCuentaTemporal({ rol: 'caja' });
    const admin = await idDeCuentaDePrueba('admin');
    try {
      await anotarAccion(cuenta.id, 'reseteo', admin);
      const { error } = await ponerContrasena(cuenta.id, 'temporal-12345');
      expect(error).toBeNull();
      expect((await perfilDe(cuenta.id)).debe_cambiar_contrasena).toBe(true);
      expect(await registrosDe(cuenta.id)).toContainEqual(
        expect.objectContaining({ accion: 'reseteo_de_contrasena', usuario_id: admin }),
      );
    } finally {
      await borrarCuentaTemporal(cuenta.id);
    }
  });

  it('cuando la persona cambia su contraseña se apaga el cambio obligado, a su nombre', async () => {
    const cuenta = await crearCuentaTemporal({ rol: 'caja' });
    try {
      // La accion del reseteo se usa en el reseteo: el cambio de despues es de la persona.
      await anotarAccion(cuenta.id, 'reseteo', null);
      await ponerContrasena(cuenta.id, 'temporal-12345');
      const propio = await iniciarSesion(cuenta.email, 'temporal-12345');
      const { error } = await propio.auth.updateUser({ password: 'la-nueva-de-ella' });
      expect(error).toBeNull();
      expect((await perfilDe(cuenta.id)).debe_cambiar_contrasena).toBe(false);
      expect(await registrosDe(cuenta.id)).toContainEqual(
        expect.objectContaining({ accion: 'cambio_de_contrasena', usuario_id: cuenta.id }),
      );
    } finally {
      await borrarCuentaTemporal(cuenta.id);
    }
  });

  it('un cambio de email sin una correccion anotada se rechaza', async () => {
    const cuenta = await crearCuentaTemporal();
    try {
      const { error } = await cambiarEmail(cuenta.id, `otro.${randomUUID()}@manteca.test`);
      expect(error).not.toBeNull();
      expect((await perfilDe(cuenta.id)).email).toBe(cuenta.email);
    } finally {
      await borrarCuentaTemporal(cuenta.id);
    }
  });

  it('una correccion anotada hace mas de 10 minutos no sirve', async () => {
    const cuenta = await crearCuentaTemporal();
    const admin = await idDeCuentaDePrueba('admin');
    try {
      await anotarAccion(cuenta.id, 'correccion', admin, ONCE_MINUTOS_ATRAS());
      const { error } = await cambiarEmail(cuenta.id, `vieja.${randomUUID()}@manteca.test`);
      expect(error).not.toBeNull();
      expect((await perfilDe(cuenta.id)).email).toBe(cuenta.email);
    } finally {
      await borrarCuentaTemporal(cuenta.id);
    }
  });

  it('la correccion del admin cambia el email del perfil, queda a su nombre y sirve una vez', async () => {
    const cuenta = await crearCuentaTemporal();
    const admin = await idDeCuentaDePrueba('admin');
    const nuevo = `corregido.${randomUUID()}@manteca.test`;
    try {
      await anotarAccion(cuenta.id, 'correccion', admin);
      expect((await cambiarEmail(cuenta.id, nuevo)).error).toBeNull();
      expect((await perfilDe(cuenta.id)).email).toBe(nuevo);
      expect(await registrosDe(cuenta.id)).toContainEqual({
        accion: 'cambio',
        usuario_id: admin,
        antes: { email: cuenta.email },
        despues: { email: nuevo },
      });
      const otra = await cambiarEmail(cuenta.id, `otra.${randomUUID()}@manteca.test`);
      expect(otra.error).not.toBeNull();
    } finally {
      await borrarCuentaTemporal(cuenta.id);
    }
  });
});

import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { exito, fallo } from '../../src/lib/resultado';
import { crearClienteSinSesion } from '../../src/lib/supabase/sin-sesion';
import {
  cambiarContrasena,
  cambiarContrasenaObligada,
  ingresar,
  registrar,
  salir,
} from '../../src/lib/usuarios/cuentas';
import { MENSAJES } from '../../src/lib/usuarios/errores';
import { clienteSecretoDePruebas } from '../clientes';
import { idPorEmail, perfilDe, registrosDe, resetearComoAdmin } from '../consultas-de-prueba';
import { emailDePrueba } from '../cuentas';
import {
  borrarCuentaTemporal,
  clienteDe,
  crearCuentaTemporal,
  type CuentaTemporal,
  type OpcionesDeCuenta,
} from '../cuentas-temporales';
import { iniciarSesion } from '../iniciar-sesion';

const OK = exito(undefined);

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

describe('registrar', () => {
  it('crea la cuenta como invitado, con su nombre, y deja la sesion iniciada', async () => {
    const cliente = crearClienteSinSesion();
    const email = `registro.${randomUUID()}@manteca.test`;
    expect(
      await registrar(cliente, { nombre: 'Ana', email, contrasena: 'una-clave-larga' }),
    ).toEqual(OK);
    const id = await idPorEmail(email);
    try {
      expect(await perfilDe(id)).toMatchObject({ nombre: 'Ana', rol: 'invitado', activo: true });
      expect((await cliente.auth.getSession()).data.session?.user.id).toBe(id);
    } finally {
      await borrarCuentaTemporal(id);
    }
  });

  it('un email que ya tiene cuenta da el mensaje de email registrado', async () => {
    const datos = {
      nombre: 'Otra',
      email: emailDePrueba('invitado'),
      contrasena: 'una-clave-larga',
    };
    expect(await registrar(crearClienteSinSesion(), datos)).toEqual(fallo(MENSAJES.emailExistente));
  });
});

describe('ingresar', () => {
  it('con los datos correctos inicia la sesion', () =>
    conCuenta({ rol: 'caja' }, async (cuenta) => {
      const cliente = crearClienteSinSesion();
      const datos = { email: cuenta.email, contrasena: cuenta.contrasena };
      expect(await ingresar(cliente, datos)).toEqual(OK);
      expect((await cliente.auth.getSession()).data.session).not.toBeNull();
    }));

  it('con la contraseña equivocada da un solo mensaje', async () => {
    const datos = { email: emailDePrueba('caja'), contrasena: 'no-es-la-contraseña' };
    expect(await ingresar(crearClienteSinSesion(), datos)).toEqual(fallo(MENSAJES.credenciales));
  });

  it('con un email que no existe da el mismo mensaje', async () => {
    const datos = { email: `nadie.${randomUUID()}@manteca.test`, contrasena: 'cualquiera' };
    expect(await ingresar(crearClienteSinSesion(), datos)).toEqual(fallo(MENSAJES.credenciales));
  });

  it('una cuenta bloqueada da el mensaje de cuenta desactivada', () =>
    conCuenta({ rol: 'caja', activo: false }, async (cuenta) => {
      await clienteSecretoDePruebas().auth.admin.updateUserById(cuenta.id, {
        ban_duration: '876000h',
      });
      const datos = { email: cuenta.email, contrasena: cuenta.contrasena };
      expect(await ingresar(crearClienteSinSesion(), datos)).toEqual(fallo(MENSAJES.desactivada));
    }));
});

describe('cambiarContrasena', () => {
  it('con la actual equivocada no la cambia', () =>
    conCuenta({ rol: 'caja' }, async (cuenta) => {
      const datos = { actual: 'no-es-la-actual', nueva: 'la-nueva-larga' };
      expect(await cambiarContrasena(await clienteDe(cuenta), datos)).toEqual(
        fallo(MENSAJES.actualNoCoincide),
      );
      await expect(iniciarSesion(cuenta.email, cuenta.contrasena)).resolves.toBeTruthy();
    }));

  it('con la actual correcta la cambia, y queda en la auditoria a su nombre', () =>
    conCuenta({ rol: 'caja' }, async (cuenta) => {
      const datos = { actual: cuenta.contrasena, nueva: 'la-nueva-larga' };
      expect(await cambiarContrasena(await clienteDe(cuenta), datos)).toEqual(OK);
      await expect(iniciarSesion(cuenta.email, 'la-nueva-larga')).resolves.toBeTruthy();
      expect(await registrosDe(cuenta.id)).toContainEqual(
        expect.objectContaining({ accion: 'cambio_de_contrasena', usuario_id: cuenta.id }),
      );
    }));

  it('la misma contraseña de antes no se acepta', () =>
    conCuenta({ rol: 'caja' }, async (cuenta) => {
      const datos = { actual: cuenta.contrasena, nueva: cuenta.contrasena };
      expect(await cambiarContrasena(await clienteDe(cuenta), datos)).toEqual(
        fallo(MENSAJES.mismaContrasena),
      );
    }));
});

describe('cambiarContrasenaObligada', () => {
  it('sin un reseteo pendiente no se puede usar', () =>
    conCuenta({ rol: 'caja' }, async (cuenta) => {
      const cliente = await clienteDe(cuenta);
      expect(await cambiarContrasenaObligada(cliente, { nueva: 'la-nueva-larga' })).toEqual(
        fallo(MENSAJES.sinPermiso),
      );
    }));

  it('despues de un reseteo la cambia sin pedir la actual y apaga el cambio obligado', () =>
    conCuenta({ rol: 'caja' }, async (cuenta) => {
      await resetearComoAdmin(cuenta.id, 'temporal-12345');
      const cliente = await iniciarSesion(cuenta.email, 'temporal-12345');
      expect(await cambiarContrasenaObligada(cliente, { nueva: 'la-nueva-larga' })).toEqual(OK);
      expect((await perfilDe(cuenta.id)).debe_cambiar_contrasena).toBe(false);
    }));
});

describe('salir', () => {
  it('cierra la sesion de este dispositivo y no la de los otros', () =>
    conCuenta({ rol: 'caja' }, async (cuenta) => {
      const aca = await clienteDe(cuenta);
      const otro = await clienteDe(cuenta);
      await salir(aca);
      expect((await aca.auth.getSession()).data.session).toBeNull();
      expect((await otro.auth.getUser()).error).toBeNull();
    }));
});

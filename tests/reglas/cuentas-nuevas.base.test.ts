import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { crearClienteSinSesion } from '../../src/lib/supabase/sin-sesion';
import { clienteSecretoDePruebas } from '../clientes';
import { perfilDe, registrosDe } from '../consultas-de-prueba';
import { borrarCuentaTemporal } from '../cuentas-temporales';
import { idDelLocalPrincipal } from '../locales';

describe('cuentas nuevas', () => {
  it('rol_de_cuenta_nueva da admin a la primera cuenta y invitado a las demas', async () => {
    const secreto = clienteSecretoDePruebas();
    const primera = await secreto.rpc('rol_de_cuenta_nueva', { cuentas: 0 });
    const otra = await secreto.rpc('rol_de_cuenta_nueva', { cuentas: 6 });
    expect([primera.data, otra.data]).toEqual(['admin', 'invitado']);
  });

  it('quien se registra queda como invitado, en el local principal, con su nombre', async () => {
    const email = `Registro.${randomUUID()}@Manteca.TEST`;
    const { data, error } = await crearClienteSinSesion().auth.signUp({
      email,
      password: 'una-clave-larga',
      options: { data: { nombre: 'Ana Prueba' } },
    });
    expect(error).toBeNull();
    const id = data.user?.id ?? '';
    try {
      expect(await perfilDe(id)).toEqual({
        nombre: 'Ana Prueba',
        email: email.toLowerCase(),
        rol: 'invitado',
        activo: true,
        debe_cambiar_contrasena: false,
        local_id: await idDelLocalPrincipal(clienteSecretoDePruebas()),
      });
      const registros = await registrosDe(id);
      expect(registros).toHaveLength(1);
      expect(registros[0]).toMatchObject({ accion: 'alta', usuario_id: id, antes: null });
    } finally {
      await borrarCuentaTemporal(id);
    }
  });
});

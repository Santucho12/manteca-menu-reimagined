import { describe, expect, it } from 'vitest';
import type { Cliente } from '../../src/lib/supabase/cliente';
import { crearClienteSinSesion } from '../../src/lib/supabase/sin-sesion';
import { idDeCuentaDePrueba, perfilDe } from '../consultas-de-prueba';
import { ROLES_DE_PRUEBA } from '../cuentas';
import { clienteComo } from '../sesiones';

// Estas funciones las usan solo los triggers. Si alguien pudiera llamarlas por RPC, una caja
// prenderia el cambio obligado de cualquiera o gastaria el reseteo pendiente de otra cuenta.
async function quienes(): Promise<[string, Cliente][]> {
  const conSesion = await Promise.all(
    ROLES_DE_PRUEBA.map(async (rol) => [rol, await clienteComo(rol)] as [string, Cliente]),
  );
  return [['visitante', crearClienteSinSesion()], ...conSesion];
}

describe('funciones de la base por RPC', () => {
  it('nadie puede anotar un cambio de contraseña ajeno', async () => {
    const caja = await idDeCuentaDePrueba('caja');
    for (const [quien, cliente] of await quienes()) {
      const { error } = await cliente.rpc('registrar_cambio_de_contrasena', {
        cuenta: caja,
        tipo: 'reseteo',
        por: caja,
      });
      expect(error?.code, quien).toBe('42501');
    }
    expect((await perfilDe(caja)).debe_cambiar_contrasena).toBe(false);
  });

  it('nadie puede gastar una accion anotada', async () => {
    const caja = await idDeCuentaDePrueba('caja');
    for (const [quien, cliente] of await quienes()) {
      const { error } = await cliente.rpc('usar_accion', { cuenta: caja, tipos: ['reseteo'] });
      expect(error?.code, quien).toBe('42501');
    }
  });

  it('nadie puede llamar a la regla de la primera cuenta', async () => {
    for (const [quien, cliente] of await quienes()) {
      const { error } = await cliente.rpc('rol_de_cuenta_nueva', { cuentas: 0 });
      expect(error?.code, quien).toBe('42501');
    }
  });
});

import { describe, expect, it } from 'vitest';
import { crearClienteSinSesion } from '../../src/lib/supabase/sin-sesion';
import { clienteSecretoDePruebas } from '../clientes';
import { idDeCuentaDePrueba } from '../consultas-de-prueba';
import { ROLES_DE_PRUEBA } from '../cuentas';
import { clienteComo } from '../sesiones';

// Si alguien pudiera anotar una correccion para su propia cuenta, se cambiaria el email solo.
describe('RLS de acciones_de_cuenta', () => {
  it.each(ROLES_DE_PRUEBA)('%s no puede anotar una accion para su cuenta', async (rol) => {
    const id = await idDeCuentaDePrueba(rol);
    const { error } = await (
      await clienteComo(rol)
    )
      .from('acciones_de_cuenta')
      .insert({ cuenta_id: id, tipo: 'correccion', por: id });
    expect(error?.code).toBe('42501');
  });

  it.each(ROLES_DE_PRUEBA)('%s no puede leer las acciones', async (rol) => {
    const { data, error } = await (await clienteComo(rol)).from('acciones_de_cuenta').select('id');
    expect(error?.code).toBe('42501');
    expect(data).toBeNull();
  });

  it('el visitante sin sesion no puede anotar ni leer', async () => {
    const visitante = crearClienteSinSesion();
    const cuenta = await idDeCuentaDePrueba('caja');
    const lectura = await visitante.from('acciones_de_cuenta').select('id');
    const alta = await visitante
      .from('acciones_de_cuenta')
      .insert({ cuenta_id: cuenta, tipo: 'correccion' });
    expect([lectura.error?.code, alta.error?.code]).toEqual(['42501', '42501']);
  });

  it('control positivo: el servidor, con la clave secreta, si llega a la tabla', async () => {
    const { error } = await clienteSecretoDePruebas()
      .from('acciones_de_cuenta')
      .select('id')
      .limit(1);
    expect(error).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { clienteSecretoDePruebas } from '../clientes';
import { idDeCuentaDePrueba, perfilDe } from '../consultas-de-prueba';
import { borrarCuentaTemporal, clienteDe, crearCuentaTemporal } from '../cuentas-temporales';
import { asegurarLocalB } from '../locales';
import { clienteComo } from '../sesiones';

async function adminsActivosDelLocalB(): Promise<number> {
  const secreto = clienteSecretoDePruebas();
  const { count, error } = await secreto
    .from('perfiles')
    .select('id', { count: 'exact', head: true })
    .eq('local_id', await asegurarLocalB(secreto))
    .eq('rol', 'admin')
    .eq('activo', true);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

describe('reglas de los admins', () => {
  it('nadie se cambia el rol ni se desactiva a si mismo', async () => {
    const cuenta = await crearCuentaTemporal({ rol: 'admin' });
    try {
      const propio = await clienteDe(cuenta);
      const rol = await propio.from('perfiles').update({ rol: 'caja' }).eq('id', cuenta.id);
      const activo = await propio.from('perfiles').update({ activo: false }).eq('id', cuenta.id);
      expect([rol.error?.code, activo.error?.code]).toEqual(['PM001', 'PM001']);
      expect(await perfilDe(cuenta.id)).toMatchObject({ rol: 'admin', activo: true });
    } finally {
      await borrarCuentaTemporal(cuenta.id);
    }
  });

  it('el ultimo admin activo de un local no se puede bajar ni desactivar', async () => {
    const id = await idDeCuentaDePrueba('adminOtroLocal');
    const secreto = clienteSecretoDePruebas();
    const baja = await secreto.from('perfiles').update({ rol: 'caja' }).eq('id', id);
    const desactivacion = await secreto.from('perfiles').update({ activo: false }).eq('id', id);
    expect([baja.error?.code, desactivacion.error?.code]).toEqual(['PM002', 'PM002']);
    expect(await perfilDe(id)).toMatchObject({ rol: 'admin', activo: true });
  });

  it('un admin baja a otro admin si queda alguno', async () => {
    const cuenta = await crearCuentaTemporal({ rol: 'admin' });
    try {
      const { data, error } = await (
        await clienteComo('admin')
      )
        .from('perfiles')
        .update({ rol: 'caja' })
        .eq('id', cuenta.id)
        .select('rol');
      expect(error).toBeNull();
      expect(data).toEqual([{ rol: 'caja' }]);
    } finally {
      await borrarCuentaTemporal(cuenta.id);
    }
  });

  it('dos admins que se bajan a la vez no dejan el local sin admins', async () => {
    const otro = await crearCuentaTemporal({ rol: 'admin', otroLocal: true });
    const idAdminB = await idDeCuentaDePrueba('adminOtroLocal');
    try {
      const [comoOtro, comoAdminB] = await Promise.all([
        clienteDe(otro),
        clienteComo('adminOtroLocal'),
      ]);
      await Promise.all([
        comoOtro.from('perfiles').update({ rol: 'caja' }).eq('id', idAdminB),
        comoAdminB.from('perfiles').update({ rol: 'caja' }).eq('id', otro.id),
      ]);
      expect(await adminsActivosDelLocalB()).toBeGreaterThanOrEqual(1);
    } finally {
      const original = { rol: 'admin' as const, activo: true };
      await clienteSecretoDePruebas().from('perfiles').update(original).eq('id', idAdminB);
      await borrarCuentaTemporal(otro.id);
    }
  });
});

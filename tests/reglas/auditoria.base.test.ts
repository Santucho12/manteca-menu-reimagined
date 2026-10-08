import { describe, expect, it } from 'vitest';
import { idDeCuentaDePrueba, registrosDe } from '../consultas-de-prueba';
import { borrarCuentaTemporal, crearCuentaTemporal } from '../cuentas-temporales';
import { clienteComo } from '../sesiones';

describe('auditoria', () => {
  it('un cambio queda con el valor anterior, el nuevo y quien lo hizo', async () => {
    const cuenta = await crearCuentaTemporal({ rol: 'caja' });
    const admin = await idDeCuentaDePrueba('admin');
    try {
      await (
        await clienteComo('admin')
      )
        .from('perfiles')
        .update({ rol: 'admin' })
        .eq('id', cuenta.id);
      // Sin la fecha de actualizacion ni la columna calculada: solo lo que cambio.
      expect(await registrosDe(cuenta.id)).toContainEqual({
        accion: 'cambio',
        usuario_id: admin,
        antes: { rol: 'caja' },
        despues: { rol: 'admin' },
      });
    } finally {
      await borrarCuentaTemporal(cuenta.id);
    }
  });

  it('desactivar y reactivar quedan como tales', async () => {
    const cuenta = await crearCuentaTemporal({ rol: 'caja' });
    try {
      const admin = await clienteComo('admin');
      await admin.from('perfiles').update({ activo: false }).eq('id', cuenta.id);
      await admin.from('perfiles').update({ activo: true }).eq('id', cuenta.id);
      const acciones = (await registrosDe(cuenta.id)).map((registro) => registro.accion);
      expect(acciones.slice(-2)).toEqual(['desactivacion', 'reactivacion']);
    } finally {
      await borrarCuentaTemporal(cuenta.id);
    }
  });

  it('un cambio que no cambia nada no deja registro', async () => {
    const cuenta = await crearCuentaTemporal({ rol: 'caja' });
    try {
      const antes = (await registrosDe(cuenta.id)).length;
      await (
        await clienteComo('admin')
      )
        .from('perfiles')
        .update({ nombre: 'Cuenta temporal' })
        .eq('id', cuenta.id);
      expect(await registrosDe(cuenta.id)).toHaveLength(antes);
    } finally {
      await borrarCuentaTemporal(cuenta.id);
    }
  });
});

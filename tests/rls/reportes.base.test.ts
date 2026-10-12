import { describe, expect, it } from 'vitest';
import { crearClienteSinSesion } from '../../src/lib/supabase/sin-sesion';
import type { RolDePrueba } from '../cuentas';
import { clienteComo } from '../sesiones';

const FUNCIONES = [
  'reporte_ventas_por_dia',
  'reporte_ventas_por_producto',
  'reporte_ventas_por_categoria',
  'reporte_gastos',
] as const;
const SIN_PERMISO: RolDePrueba[] = ['invitado', 'caja', 'encargado', 'desactivado'];
const PERIODO = { desde: '2000-01-01', hasta: '2100-12-31' };

describe('reportes: quien los lee', () => {
  it.each(SIN_PERMISO)('%s recibe rechazo en las cuatro funciones', async (rol) => {
    const cliente = await clienteComo(rol);
    for (const funcion of FUNCIONES) {
      const { error } = await cliente.rpc(funcion as never, PERIODO as never);
      expect(error?.code, funcion).toBe('42501');
    }
  });

  it('el visitante no puede llamarlas', async () => {
    for (const funcion of FUNCIONES) {
      const { error } = await crearClienteSinSesion().rpc(funcion as never, PERIODO as never);
      expect(error?.code, funcion).toBe('42501');
    }
  });
});

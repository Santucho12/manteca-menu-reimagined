import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearClienteSinSesion } from '../../src/lib/supabase/sin-sesion';
import type { RolDePrueba } from '../cuentas';
import { clienteComo } from '../sesiones';
import { borrarVentas, sembrarVenta, ventaDe } from '../ventas-de-prueba';

const TABLAS = ['ventas', 'renglones_de_venta', 'pagos_de_venta', 'canales_de_venta'] as const;
const SIN_PERMISO: RolDePrueba[] = ['invitado', 'caja', 'encargado', 'desactivado'];
let delLocal: { id: string };
let deOtroLocal: { id: string };

beforeAll(async () => {
  delLocal = await sembrarVenta();
  deOtroLocal = await sembrarVenta({ otroLocal: true });
});

afterAll(() => borrarVentas([delLocal.id, deOtroLocal.id]));

// Con `solo` se piden esos ids: la lista entera topea en 1000 filas y la base de pruebas tiene mas.
async function idsQueVe(rol: RolDePrueba, tabla: (typeof TABLAS)[number], solo?: string[]) {
  const consulta = (await clienteComo(rol)).from(tabla).select('id');
  const { data, error } = await (solo ? consulta.in('id', solo) : consulta);
  expect(error).toBeNull();
  return (data ?? []).map((fila) => fila.id);
}

describe('RLS de ventas: lectura', () => {
  it('el admin ve las ventas y los canales de su local, no los de otro', async () => {
    const ids = await idsQueVe('admin', 'ventas', [delLocal.id, deOtroLocal.id]);
    expect(ids).toContain(delLocal.id);
    expect(ids).not.toContain(deOtroLocal.id);
    expect((await idsQueVe('admin', 'canales_de_venta')).length).toBeGreaterThanOrEqual(4);
  });

  it.each(SIN_PERMISO)('%s no ve nada', async (rol) => {
    for (const tabla of TABLAS) expect(await idsQueVe(rol, tabla), tabla).toEqual([]);
  });

  it('el visitante no puede leer', async () => {
    for (const tabla of TABLAS) {
      const { error } = await crearClienteSinSesion().from(tabla).select('id');
      expect(error?.code, tabla).toBe('42501');
    }
  });
});

describe('RLS de ventas: escritura', () => {
  it('nadie inserta una venta directo: se guarda con la funcion', async () => {
    const { error } = await (
      await clienteComo('admin')
    )
      .from('ventas')
      .insert({ fecha: '2026-10-01', total_centavos: 1 } as never);
    expect(error?.code).toBe('42501');
  });

  it('nadie borra una venta', async () => {
    const { error } = await (
      await clienteComo('admin')
    )
      .from('ventas')
      .delete()
      .eq('id', delLocal.id);
    expect(error?.code).toBe('42501');
  });

  it.each([...SIN_PERMISO, 'adminOtroLocal'] as RolDePrueba[])(
    '%s no anula una venta de este local',
    async (rol) => {
      await (
        await clienteComo(rol)
      )
        .from('ventas')
        .update({ anulado: true, motivo_anulacion: 'x' })
        .eq('id', delLocal.id);
      expect((await ventaDe(delLocal.id)).anulado).toBe(false);
    },
  );
});

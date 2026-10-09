import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearClienteSinSesion } from '../../src/lib/supabase/sin-sesion';
import { borrarCierres, cierreDe, diaLibre, sembrarCierre } from '../cierres-de-prueba';
import type { RolDePrueba } from '../cuentas';
import { clienteComo } from '../sesiones';

const TABLAS = ['cierres_de_caja', 'retiros_de_caja', 'configuracion_de_caja'] as const;
const SIN_PERMISO: RolDePrueba[] = ['invitado', 'encargado', 'desactivado'];
let deCaja: { id: string };
let deAdmin: { id: string };
let deOtroLocal: { id: string };

beforeAll(async () => {
  deCaja = await sembrarCierre({ cargadoPor: 'caja' });
  deAdmin = await sembrarCierre({ cargadoPor: 'admin' });
  deOtroLocal = await sembrarCierre({ cargadoPor: 'adminOtroLocal', otroLocal: true });
});

afterAll(() => borrarCierres([deCaja.id, deAdmin.id, deOtroLocal.id]));

async function idsQueVe(rol: RolDePrueba, tabla: (typeof TABLAS)[number]) {
  const { data, error } = await (await clienteComo(rol)).from(tabla).select('id');
  expect(error).toBeNull();
  return (data ?? []).map((fila) => fila.id);
}

describe('RLS de cierres: lectura', () => {
  it('el admin ve los cierres de su local y la tolerancia', async () => {
    const ids = await idsQueVe('admin', 'cierres_de_caja');
    expect(ids).toEqual(expect.arrayContaining([deCaja.id, deAdmin.id]));
    expect(ids).not.toContain(deOtroLocal.id);
    const { data } = await (
      await clienteComo('admin')
    )
      .from('configuracion_de_caja')
      .select('tolerancia_centavos');
    expect(data).toEqual([{ tolerancia_centavos: 50000 }]);
  });

  it('caja ve solo sus cierres y no la tolerancia', async () => {
    const ids = await idsQueVe('caja', 'cierres_de_caja');
    expect(ids).toContain(deCaja.id);
    expect(ids).not.toContain(deAdmin.id);
    expect(await idsQueVe('caja', 'configuracion_de_caja')).toEqual([]);
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

describe('RLS de cierres: escritura', () => {
  it('nadie inserta un cierre directo: se guarda con la funcion', async () => {
    const { error } = await (await clienteComo('admin')).from('cierres_de_caja').insert({
      fecha: diaLibre(),
      fondo_inicial_centavos: 0,
      efectivo_centavos: 0,
      queda_en_caja_centavos: 0,
    } as never);
    expect(error?.code).toBe('42501');
  });

  it('nadie borra un cierre', async () => {
    const { error } = await (
      await clienteComo('admin')
    )
      .from('cierres_de_caja')
      .delete()
      .eq('id', deCaja.id);
    expect(error?.code).toBe('42501');
  });

  it.each(['caja', ...SIN_PERMISO, 'adminOtroLocal'] as RolDePrueba[])(
    '%s no revisa un cierre de este local',
    async (rol) => {
      await (
        await clienteComo(rol)
      )
        .from('cierres_de_caja')
        .update({ comentario_revision: 'Tocado' })
        .eq('id', deCaja.id);
      expect((await cierreDe(deCaja.id)).comentario_revision).toBeNull();
    },
  );

  it('caja no cambia la tolerancia', async () => {
    await (
      await clienteComo('caja')
    )
      .from('configuracion_de_caja')
      .update({ tolerancia_centavos: 1 });
    const { data } = await (
      await clienteComo('admin')
    )
      .from('configuracion_de_caja')
      .select('tolerancia_centavos');
    expect(data?.[0]?.tolerancia_centavos).toBe(50000);
  });
});

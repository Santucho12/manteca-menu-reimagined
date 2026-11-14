import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearClienteSinSesion } from '../../src/lib/supabase/sin-sesion';
import {
  borrarDiasSinAbrir,
  diaLibre,
  diaSinAbrirDe,
  sembrarDiaSinAbrir,
} from '../cierres-de-prueba';
import type { RolDePrueba } from '../cuentas';
import { clienteComo } from '../sesiones';

const SIN_PERMISO: RolDePrueba[] = ['caja', 'invitado', 'encargado', 'desactivado'];
const deEsteLocal = diaLibre();
const delOtroLocal = diaLibre();

beforeAll(async () => {
  await sembrarDiaSinAbrir({ fecha: deEsteLocal });
  await sembrarDiaSinAbrir({ fecha: delOtroLocal, otroLocal: true });
});

afterAll(() => borrarDiasSinAbrir([deEsteLocal, delOtroLocal]));

async function fechasQueVe(rol: RolDePrueba) {
  const cliente = await clienteComo(rol);
  const { data, error } = await cliente.from('dias_sin_abrir').select('fecha');
  return { error, fechas: data?.map((dia) => dia.fecha) };
}

describe('RLS de los dias sin abrir: lectura', () => {
  it('el admin ve los de su local y no los del otro', async () => {
    const { error, fechas } = await fechasQueVe('admin');
    expect(error).toBeNull();
    expect(fechas).toContain(deEsteLocal);
    expect(fechas).not.toContain(delOtroLocal);
  });

  it('el admin del otro local ve solo los suyos', async () => {
    const { fechas } = await fechasQueVe('adminOtroLocal');
    expect(fechas).toContain(delOtroLocal);
    expect(fechas).not.toContain(deEsteLocal);
  });

  it.each(SIN_PERMISO)('%s no ve ninguno', async (rol) => {
    const { error, fechas } = await fechasQueVe(rol);
    expect(error).toBeNull();
    expect(fechas).toEqual([]);
  });

  it('el visitante no puede leer', async () => {
    const { error } = await crearClienteSinSesion().from('dias_sin_abrir').select('fecha');
    expect(error?.code).toBe('42501');
  });
});

describe('RLS de los dias sin abrir: escritura', () => {
  it('nadie inserta directo: se marca con la funcion', async () => {
    const admin = await clienteComo('admin');
    const { error } = await admin.from('dias_sin_abrir').insert({ fecha: diaLibre() });
    expect(error?.code).toBe('42501');
  });

  it('nadie cambia ni borra directo', async () => {
    const admin = await clienteComo('admin');
    const cambio = await admin
      .from('dias_sin_abrir')
      .update({ activo: false })
      .eq('fecha', deEsteLocal);
    expect(cambio.error?.code).toBe('42501');
    const borrado = await admin.from('dias_sin_abrir').delete().eq('fecha', deEsteLocal);
    expect(borrado.error?.code).toBe('42501');
    expect((await diaSinAbrirDe(deEsteLocal))?.activo).toBe(true);
  });

  it('el admin de otro local no deshace la marca de este local', async () => {
    const otro = await clienteComo('adminOtroLocal');
    await otro.rpc('cierres_marcar_sin_abrir', { la_fecha: deEsteLocal, marcar: false });
    expect((await diaSinAbrirDe(deEsteLocal))?.activo).toBe(true);
  });
});

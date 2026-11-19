import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearClienteSinSesion } from '../../src/lib/supabase/sin-sesion';
import { clienteSecretoDePruebas } from '../clientes';
import { borrarPostergaciones, diaLibre } from '../cierres-de-prueba';
import { idDeCuentaDePrueba } from '../consultas-de-prueba';
import type { RolDePrueba } from '../cuentas';
import { asegurarLocalB, idDelLocalPrincipal } from '../locales';
import { clienteComo } from '../sesiones';

const deCaja = diaLibre();
const delAdmin = diaLibre();
const delOtroLocal = diaLibre();
const ids: string[] = [];

async function sembrar(fecha: string, rol: RolDePrueba, otroLocal = false) {
  const secreto = clienteSecretoDePruebas();
  const local = otroLocal ? asegurarLocalB : idDelLocalPrincipal;
  const desde = new Date();
  const { data, error } = await secreto
    .from('postergaciones_de_cierre')
    .insert({
      local_id: await local(secreto),
      fecha,
      turno: 1,
      postergado_por: await idDeCuentaDePrueba(rol),
      desde: desde.toISOString(),
      hasta: new Date(desde.getTime() + 600_000).toISOString(),
    })
    .select('id')
    .single();
  if (error) throw new Error(`No pude sembrar la postergación: ${error.message}`);
  ids.push(data.id);
}

beforeAll(async () => {
  await sembrar(deCaja, 'caja');
  await sembrar(delAdmin, 'admin');
  await sembrar(delOtroLocal, 'adminOtroLocal', true);
});

afterAll(async () => {
  await borrarPostergaciones([deCaja, delAdmin]);
  const secreto = clienteSecretoDePruebas();
  await secreto.from('postergaciones_de_cierre').delete().in('id', ids);
});

async function fechasQueVe(rol: RolDePrueba) {
  const cliente = await clienteComo(rol);
  const { data, error } = await cliente.from('postergaciones_de_cierre').select('fecha');
  return { error, fechas: data?.map((fila) => fila.fecha) };
}

describe('RLS de las postergaciones: lectura', () => {
  it('el admin ve las de su local y no las del otro', async () => {
    const { error, fechas } = await fechasQueVe('admin');
    expect(error).toBeNull();
    expect(fechas).toEqual(expect.arrayContaining([deCaja, delAdmin]));
    expect(fechas).not.toContain(delOtroLocal);
  });

  it('caja ve solo las suyas', async () => {
    const { fechas } = await fechasQueVe('caja');
    expect(fechas).toContain(deCaja);
    expect(fechas).not.toContain(delAdmin);
  });

  it.each(['invitado', 'encargado', 'desactivado'] as const)('%s no ve ninguna', async (rol) => {
    expect(await fechasQueVe(rol)).toEqual({ error: null, fechas: [] });
  });

  it('el visitante sin sesión recibe rechazo', async () => {
    const { error } = await crearClienteSinSesion().from('postergaciones_de_cierre').select('id');
    expect(error?.code).toBe('42501');
  });
});

describe('RLS de las postergaciones: escritura', () => {
  it('nadie inserta, cambia ni borra directo', async () => {
    const admin = await clienteComo('admin');
    const tabla = () => admin.from('postergaciones_de_cierre');
    const alta = await tabla().insert({ fecha: delAdmin, turno: 1, desde: 'now', hasta: 'now' });
    const cambio = await tabla().update({ turno: 2 }).eq('fecha', delAdmin);
    const baja = await tabla().delete().eq('fecha', delAdmin);
    expect([alta.error?.code, cambio.error?.code, baja.error?.code]).toEqual([
      '42501',
      '42501',
      '42501',
    ]);
  });
});

describe('RLS de la traba: quién la usa', () => {
  it.each(['invitado', 'encargado', 'desactivado'] as const)(
    '%s no lee el estado ni posterga',
    async (rol) => {
      const cliente = await clienteComo(rol);
      const estado = await cliente.rpc('caja_estado_del_mostrador');
      const postergar = await cliente.rpc('caja_postergar_cierre');
      expect([estado.error?.code, postergar.error?.code]).toEqual(['42501', '42501']);
    },
  );

  it('caja no cambia las horas de cierre', async () => {
    const caja = await clienteComo('caja');
    const { data } = await caja
      .from('configuracion_de_caja')
      .update({ hora_cierre_mediodia: '10:00' })
      .not('id', 'is', null)
      .select('id');
    expect(data ?? []).toEqual([]);
  });
});

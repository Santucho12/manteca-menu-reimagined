import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearClienteSinSesion } from '../../src/lib/supabase/sin-sesion';
import { borrarCierres, sembrarCierre } from '../cierres-de-prueba';
import { clienteSecretoDePruebas } from '../clientes';
import type { RolDePrueba } from '../cuentas';
import { asegurarLocalB, idDelLocalPrincipal } from '../locales';
import { clienteComo } from '../sesiones';
import { borrarVentas, idDeCanal, sembrarCanal } from '../ventas-de-prueba';

const cierres: string[] = [];
const canales: string[] = [];
let deCaja: string;
let delAdmin: string;
let delOtroLocal: string;

async function controlSembrado(cierre: string, canal: string, otroLocal = false) {
  const secreto = clienteSecretoDePruebas();
  const local = otroLocal ? asegurarLocalB : idDelLocalPrincipal;
  const { error } = await secreto.from('controles_de_cierre').insert({
    local_id: await local(secreto),
    cierre_id: cierre,
    canal_id: canal,
    cantidad: 1,
    total_centavos: 1000,
  });
  if (error) throw new Error(`No pude sembrar el control: ${error.message}`);
}

beforeAll(async () => {
  const canal = await sembrarCanal();
  canales.push(canal.id);
  deCaja = (await sembrarCierre({ cargadoPor: 'caja' })).id;
  delAdmin = (await sembrarCierre({ cargadoPor: 'admin' })).id;
  delOtroLocal = (await sembrarCierre({ otroLocal: true, cargadoPor: 'adminOtroLocal' })).id;
  cierres.push(deCaja, delAdmin, delOtroLocal);
  await controlSembrado(deCaja, canal.id);
  await controlSembrado(delAdmin, canal.id);
  await controlSembrado(delOtroLocal, await idDeCanal('Local', true), true);
});

afterAll(async () => {
  await clienteSecretoDePruebas().from('controles_de_cierre').delete().in('cierre_id', cierres);
  await borrarCierres(cierres);
  await borrarVentas([], { canales });
});

async function cierresQueVe(rol: RolDePrueba) {
  const { data, error } = await (
    await clienteComo(rol)
  )
    .from('controles_de_cierre')
    .select('cierre_id');
  return { error, ids: data?.map((fila) => fila.cierre_id) };
}

describe('RLS de los controles del cierre: lectura', () => {
  it('el admin ve los de su local y no los del otro', async () => {
    const { error, ids } = await cierresQueVe('admin');
    expect(error).toBeNull();
    expect(ids).toEqual(expect.arrayContaining([deCaja, delAdmin]));
    expect(ids).not.toContain(delOtroLocal);
  });

  it('caja ve solo los de sus cierres', async () => {
    const { ids } = await cierresQueVe('caja');
    expect(ids).toContain(deCaja);
    expect(ids).not.toContain(delAdmin);
  });

  it.each(['invitado', 'encargado', 'desactivado'] as const)('%s no ve ninguno', async (rol) => {
    expect(await cierresQueVe(rol)).toEqual({ error: null, ids: [] });
  });

  it('el visitante sin sesión recibe rechazo', async () => {
    const { error } = await crearClienteSinSesion().from('controles_de_cierre').select('id');
    expect(error?.code).toBe('42501');
  });
});

describe('RLS de los controles del cierre: escritura', () => {
  it('nadie inserta, cambia ni borra directo', async () => {
    const tabla = () => clienteComo('admin').then((c) => c.from('controles_de_cierre'));
    const alta = await (
      await tabla()
    ).insert({ cierre_id: delAdmin, canal_id: canales[0]!, total_centavos: 1 });
    const cambio = await (await tabla()).update({ total_centavos: 5 }).eq('cierre_id', delAdmin);
    const baja = await (await tabla()).delete().eq('cierre_id', delAdmin);
    expect([alta.error?.code, cambio.error?.code, baja.error?.code]).toEqual([
      '42501',
      '42501',
      '42501',
    ]);
  });
});

describe('RLS de los tipos para vender', () => {
  it.each(['invitado', 'encargado', 'desactivado'] as const)('%s no los lee', async (rol) => {
    const { error } = await (await clienteComo(rol)).rpc('caja_tipos_para_vender');
    expect(error?.code).toBe('42501');
  });
});

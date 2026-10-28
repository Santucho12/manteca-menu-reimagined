import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearClienteSinSesion } from '../../src/lib/supabase/sin-sesion';
import { clienteSecretoDePruebas } from '../clientes';
import type { RolDePrueba } from '../cuentas';
import { borrarGastos, idDeCategoria, sembrarPorPagar } from '../gastos-de-prueba';
import { asegurarLocalB, idDelLocalPrincipal } from '../locales';
import { clienteComo } from '../sesiones';

const SIN_PERMISO: RolDePrueba[] = ['invitado', 'caja', 'encargado', 'desactivado'];
const porPagar: string[] = [];
let delLocal: { id: string };
let deOtroLocal: { id: string };

beforeAll(async () => {
  delLocal = await sembrarPorPagar();
  deOtroLocal = await sembrarPorPagar({ otroLocal: true });
  porPagar.push(delLocal.id, deOtroLocal.id);
});

afterAll(() => borrarGastos({ porPagar }));

async function idsQueVe(rol: RolDePrueba) {
  const { data, error } = await (await clienteComo(rol)).from('gastos_por_pagar').select('id');
  expect(error).toBeNull();
  return (data ?? []).map((fila) => fila.id);
}

async function filaDe(id: string) {
  const { data } = await clienteSecretoDePruebas()
    .from('gastos_por_pagar')
    .select('local_id, creado_por, anulado')
    .eq('id', id)
    .single();
  return data!;
}

const nuevo = async () => ({
  vencimiento: '2099-06-01',
  categoria_id: await idDeCategoria('Alquiler'),
  monto_centavos: 150000,
  clave: crypto.randomUUID(),
});

describe('RLS de lo por pagar: lectura', () => {
  it('el admin ve lo de su local y no lo de otro', async () => {
    const ids = await idsQueVe('admin');
    expect(ids).toContain(delLocal.id);
    expect(ids).not.toContain(deOtroLocal.id);
  });

  it.each(SIN_PERMISO)('%s no ve nada', async (rol) => {
    expect(await idsQueVe(rol)).toEqual([]);
  });

  it('el visitante no puede leer', async () => {
    const { error } = await crearClienteSinSesion().from('gastos_por_pagar').select('id');
    expect(error?.code).toBe('42501');
  });

  it('pagos_pendientes no le da nada a quien no es admin', async () => {
    const { data, error } = await (await clienteComo('invitado')).rpc('pagos_pendientes');
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

describe('RLS de lo por pagar: escritura', () => {
  it('el admin anota algo por pagar y queda en su local, a su nombre', async () => {
    const { data, error } = await (
      await clienteComo('admin')
    )
      .from('gastos_por_pagar')
      .insert(await nuevo())
      .select('id')
      .single();
    expect(error).toBeNull();
    porPagar.push(data!.id);
    const fila = await filaDe(data!.id);
    expect(fila.local_id).toBe(await idDelLocalPrincipal(clienteSecretoDePruebas()));
    expect(fila.creado_por).not.toBeNull();
  });

  it('no puede mandar el local', async () => {
    const { error } = await (
      await clienteComo('admin')
    )
      .from('gastos_por_pagar')
      .insert({ ...(await nuevo()), local_id: await asegurarLocalB(clienteSecretoDePruebas()) });
    expect(error?.code).toBe('42501');
  });

  it('caja no anota nada por pagar', async () => {
    const { error } = await (
      await clienteComo('caja')
    )
      .from('gastos_por_pagar')
      .insert(await nuevo());
    expect(error?.code).toBe('42501');
  });

  it('nadie borra lo por pagar', async () => {
    const { error } = await (
      await clienteComo('admin')
    )
      .from('gastos_por_pagar')
      .delete()
      .eq('id', delLocal.id);
    expect(error?.code).toBe('42501');
  });

  it.each([...SIN_PERMISO, 'adminOtroLocal' as const])('%s no lo anula', async (rol) => {
    await (
      await clienteComo(rol)
    )
      .from('gastos_por_pagar')
      .update({ anulado: true, motivo_anulacion: 'Tocado' })
      .eq('id', delLocal.id);
    expect((await filaDe(delLocal.id)).anulado).toBe(false);
  });
});

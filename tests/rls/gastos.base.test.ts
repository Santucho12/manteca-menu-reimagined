import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearClienteSinSesion } from '../../src/lib/supabase/sin-sesion';
import { clienteSecretoDePruebas } from '../clientes';
import type { RolDePrueba } from '../cuentas';
import {
  borrarGastos,
  gastoDe,
  idDeCategoria,
  sembrarGasto,
  sembrarRecurrente,
} from '../gastos-de-prueba';
import { asegurarLocalB, idDelLocalPrincipal } from '../locales';
import { clienteComo } from '../sesiones';

const TABLAS = ['gastos', 'gastos_recurrentes', 'categorias_de_gasto'] as const;
const SIN_PERMISO: RolDePrueba[] = ['invitado', 'caja', 'encargado', 'desactivado'];
const gastos: string[] = [];
const recurrentes: string[] = [];
let delLocal: { id: string };
let deOtroLocal: { id: string };

beforeAll(async () => {
  delLocal = await sembrarGasto();
  deOtroLocal = await sembrarGasto({ otroLocal: true });
  gastos.push(delLocal.id, deOtroLocal.id);
  recurrentes.push((await sembrarRecurrente({ primerVencimiento: '2099-01-10' })).id);
});

afterAll(() => borrarGastos({ gastos, recurrentes }));

async function idsQueVe(rol: RolDePrueba, tabla: (typeof TABLAS)[number]) {
  const { data, error } = await (await clienteComo(rol)).from(tabla).select('id');
  expect(error).toBeNull();
  return (data ?? []).map((fila) => fila.id);
}

describe('RLS de gastos: lectura', () => {
  it('el admin ve lo de su local y no lo de otro', async () => {
    const ids = await idsQueVe('admin', 'gastos');
    expect(ids).toContain(delLocal.id);
    expect(ids).not.toContain(deOtroLocal.id);
    expect(await idsQueVe('admin', 'gastos_recurrentes')).toContain(recurrentes[0]);
    expect((await idsQueVe('admin', 'categorias_de_gasto')).length).toBeGreaterThanOrEqual(8);
  });

  it.each(SIN_PERMISO.filter((rol) => rol !== 'caja'))('%s no ve nada', async (rol) => {
    for (const tabla of TABLAS) expect(await idsQueVe(rol, tabla), tabla).toEqual([]);
  });

  // Caja ve solo los gastos que salieron de sus propios cierres (tests/rls/cierres).
  it('caja no ve los gastos del local, ni recurrentes ni categorias', async () => {
    expect(await idsQueVe('caja', 'gastos')).not.toContain(delLocal.id);
    expect(await idsQueVe('caja', 'gastos_recurrentes')).toEqual([]);
    expect(await idsQueVe('caja', 'categorias_de_gasto')).toEqual([]);
  });

  it('el visitante no puede leer', async () => {
    for (const tabla of TABLAS) {
      const { error } = await crearClienteSinSesion().from(tabla).select('id');
      expect(error?.code, tabla).toBe('42501');
    }
  });
});

describe('RLS de gastos: escritura', () => {
  it('el admin carga un gasto y queda en su local, a su nombre', async () => {
    const categoria = await idDeCategoria('Alquiler');
    const { data, error } = await (
      await clienteComo('admin')
    )
      .from('gastos')
      .insert({
        fecha: '2026-10-01',
        categoria_id: categoria,
        monto_centavos: 1000050,
        medio_de_pago: 'tarjeta',
      })
      .select('id')
      .single();
    expect(error).toBeNull();
    gastos.push(data!.id);
    const fila = await gastoDe(data!.id);
    expect(fila.local_id).toBe(await idDelLocalPrincipal(clienteSecretoDePruebas()));
    expect(fila.creado_por).not.toBeNull();
  });

  it('no puede mandar el local', async () => {
    const { error } = await (await clienteComo('admin')).from('gastos').insert({
      fecha: '2026-10-01',
      categoria_id: await idDeCategoria('Alquiler'),
      monto_centavos: 100,
      medio_de_pago: 'tarjeta',
      local_id: await asegurarLocalB(clienteSecretoDePruebas()),
    });
    expect(error?.code).toBe('42501');
  });

  it('el admin carga un fijo con su clave y caja no', async () => {
    const fila = {
      categoria_id: await idDeCategoria('Alquiler'),
      monto_centavos: 1000,
      medio_de_pago: 'transferencia' as const,
      frecuencia: 'mensual' as const,
      primer_vencimiento: '2099-04-10',
    };
    const { data, error } = await (await clienteComo('admin'))
      .from('gastos_recurrentes')
      .insert({ ...fila, clave: crypto.randomUUID() })
      .select('id')
      .single();
    expect(error).toBeNull();
    recurrentes.push(data!.id);
    const deCaja = await (await clienteComo('caja'))
      .from('gastos_recurrentes')
      .insert({ ...fila, clave: crypto.randomUUID() });
    expect(deCaja.error?.code).toBe('42501');
  });

  it('nadie borra un gasto', async () => {
    const { error } = await (
      await clienteComo('admin')
    )
      .from('gastos')
      .delete()
      .eq('id', delLocal.id);
    expect(error?.code).toBe('42501');
  });

  it.each([...SIN_PERMISO, 'adminOtroLocal' as const])(
    '%s no cambia un gasto de este local',
    async (rol) => {
      await (
        await clienteComo(rol)
      )
        .from('gastos')
        .update({ descripcion: 'Tocado' })
        .eq('id', delLocal.id);
      expect((await gastoDe(delLocal.id)).descripcion).toBeNull();
    },
  );
});

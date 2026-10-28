import { afterAll, describe, expect, it } from 'vitest';
import { clienteSecretoDePruebas } from '../clientes';
import type { RolDePrueba } from '../cuentas';
import { clienteComo } from '../sesiones';
import { borrarVentas, idDeCanal, sembrarCanal, sembrarVenta } from '../ventas-de-prueba';

const ventas: string[] = [];
const canales: string[] = [];

afterAll(() => borrarVentas(ventas, { canales }));

async function borrar(rol: RolDePrueba, id: string) {
  return (await clienteComo(rol)).rpc('ventas_borrar_canal', { el_canal: id });
}

async function existe(id: string) {
  const { data } = await clienteSecretoDePruebas()
    .from('canales_de_venta')
    .select('id')
    .eq('id', id);
  return (data ?? []).length === 1;
}

describe('borrar un canal de venta', () => {
  it('borra un canal sin ventas y deja la baja en la auditoria, con su nombre', async () => {
    const canal = await sembrarCanal();
    canales.push(canal.id);
    const { error } = await borrar('admin', canal.id);
    expect(error).toBeNull();
    expect(await existe(canal.id)).toBe(false);
    const { data } = await clienteSecretoDePruebas()
      .from('auditoria')
      .select('accion, tabla, antes')
      .eq('registro_id', canal.id)
      .eq('accion', 'baja');
    expect(data).toEqual([
      {
        accion: 'baja',
        tabla: 'canales_de_venta',
        antes: expect.objectContaining({ nombre: canal.nombre }),
      },
    ]);
  });

  it('no borra un canal que ya tiene ventas: hay que desactivarlo', async () => {
    const canal = await sembrarCanal();
    canales.push(canal.id);
    const venta = await sembrarVenta();
    ventas.push(venta.id);
    await clienteSecretoDePruebas()
      .from('ventas')
      .update({ canal_id: canal.id })
      .eq('id', venta.id);
    expect((await borrar('admin', canal.id)).error?.code).toBe('PV309');
    expect(await existe(canal.id)).toBe(true);
  });

  it('no borra un canal que no existe o es de otro local', async () => {
    const ajeno = await idDeCanal('Cheaf', true);
    expect((await borrar('admin', ajeno)).error?.code).toBe('PV303');
    expect(await existe(ajeno)).toBe(true);
    const inexistente = '00000000-0000-4000-8000-000000000000';
    expect((await borrar('admin', inexistente)).error?.code).toBe('PV303');
  });

  it.each(['caja', 'invitado', 'encargado'] as RolDePrueba[])(
    '%s no borra canales',
    async (rol) => {
      const canal = await sembrarCanal();
      canales.push(canal.id);
      expect((await borrar(rol, canal.id)).error?.code).toBe('42501');
      expect(await existe(canal.id)).toBe(true);
    },
  );
});

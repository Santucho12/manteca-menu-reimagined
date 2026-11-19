import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { diaEnArgentina } from '../../src/lib/fechas';
import { crearClienteSinSesion } from '../../src/lib/supabase/sin-sesion';
import { SiembraDeCompras, unaClave } from '../compras-de-prueba';
import type { RolDePrueba } from '../cuentas';
import { clienteComo } from '../sesiones';

const SIN_PERMISO: RolDePrueba[] = [
  'invitado',
  'caja',
  'encargado',
  'desactivado',
  'adminOtroLocal',
];
const TABLAS = ['compras', 'renglones_de_compra'] as const;
const siembra = new SiembraDeCompras();
let compraId: string;
let proveedorId: string;
let formaId: string;

const datosDeCompra = () => ({
  proveedor_id: proveedorId,
  fecha: diaEnArgentina(new Date()),
  clave: unaClave(),
  pago: { tipo: 'pagada', medio: 'transferencia', fecha: diaEnArgentina(new Date()) },
  renglones: [{ forma_de_compra_id: formaId, cantidad: 1, precio_unitario_centavos: 1_000 }],
});

beforeAll(async () => {
  proveedorId = (await siembra.proveedor()).id;
  formaId = (await siembra.forma(proveedorId)).id;
  const { data, error } = await (
    await clienteComo('admin')
  ).rpc('compras_recibir', { datos: datosDeCompra() });
  if (error) throw new Error(error.message);
  compraId = data!;
});

afterAll(() => siembra.borrar());

describe('RLS de compras', () => {
  it('el admin ve la compra y sus renglones', async () => {
    const admin = await clienteComo('admin');
    expect((await admin.from('compras').select('id').eq('id', compraId)).data).toEqual([
      { id: compraId },
    ]);
    const renglones = await admin
      .from('renglones_de_compra')
      .select('compra_id')
      .eq('compra_id', compraId);
    expect(renglones.data).toHaveLength(1);
  });

  it.each(SIN_PERMISO)('%s no ve compras', async (rol) => {
    const cliente = await clienteComo(rol);
    for (const tabla of TABLAS) {
      const { data, error } = await cliente.from(tabla).select('id');
      expect(error).toBeNull();
      expect(data).toEqual([]);
    }
  });

  it.each(TABLAS)('el visitante no lee %s', async (tabla) => {
    expect((await crearClienteSinSesion().from(tabla).select('id')).error?.code).toBe('42501');
  });

  it.each(SIN_PERMISO)('%s no carga, no pide ni anula', async (rol) => {
    const cliente = await clienteComo(rol);
    expect((await cliente.rpc('compras_recibir', { datos: datosDeCompra() })).error).not.toBeNull();
    const pedido = {
      proveedor_id: proveedorId,
      clave: unaClave(),
      renglones: [{ forma_de_compra_id: formaId, cantidad: 1 }],
    };
    expect((await cliente.rpc('compras_pedir', { datos: pedido })).error).not.toBeNull();
    expect(
      (await cliente.rpc('compras_anular', { la_compra: compraId, motivo: 'x' })).error,
    ).not.toBeNull();
  });

  it('nadie escribe las tablas directo', async () => {
    const admin = await clienteComo('admin');
    expect(
      (await admin.from('compras').update({ total_centavos: 1 }).eq('id', compraId)).error?.code,
    ).toBe('42501');
    expect((await admin.from('compras').delete().eq('id', compraId)).error?.code).toBe('42501');
  });
});

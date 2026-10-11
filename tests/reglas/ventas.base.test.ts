import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { diaEnArgentina } from '../../src/lib/fechas';
import { sumarMeses } from '../../src/lib/gastos/vencimientos';
import type { Json } from '../../src/lib/supabase/tipos';
import { clienteSecretoDePruebas } from '../clientes';
import { idDeCuentaDePrueba, registrosDe } from '../consultas-de-prueba';
import type { RolDePrueba } from '../cuentas';
import { clienteComo } from '../sesiones';
import {
  borrarVentas,
  datosDeVenta,
  idDeCanal,
  productoParaVender,
  sembrarCanal,
  sembrarVenta,
  ventaDe,
  type ParaVender,
} from '../ventas-de-prueba';

const HOY = diaEnArgentina(new Date());
const ventas: string[] = [];
const canales: string[] = [];
const categoriasDelMenu: string[] = [];
let producto: ParaVender;
let cheaf: string;

beforeAll(async () => {
  producto = await productoParaVender();
  categoriasDelMenu.push(producto.categoriaId);
  cheaf = await idDeCanal('Cheaf');
});

afterAll(() => borrarVentas(ventas, { canales, categoriasDelMenu }));

async function guardar(rol: RolDePrueba, datos: Json) {
  const respuesta = await (await clienteComo(rol)).rpc('ventas_guardar_manual', { datos });
  if (respuesta.data) ventas.push(respuesta.data);
  return respuesta;
}

const dosRenglones = () => [
  { producto, cantidad: 2, precioCentavos: 100000 },
  { producto, cantidad: 1.5, precioCentavos: 33333 },
];

describe('guardar una venta a mano', () => {
  it('calcula cada subtotal y el total, y la deja cerrada a nombre de quien la carga', async () => {
    const { data: id, error } = await guardar('admin', datosDeVenta(HOY, cheaf, dosRenglones()));
    expect(error).toBeNull();
    const venta = await ventaDe(id!);
    // 2 x $1.000,00 + 1,5 x $333,33 = $2.000,00 + $500,00 (49999,5 redondea a 50000).
    expect(venta).toMatchObject({
      origen: 'manual',
      estado: 'cerrada',
      total_centavos: 250000,
      canal_id: cheaf,
      creado_por: await idDeCuentaDePrueba('admin'),
    });
    expect(venta.renglones.map((r) => r.subtotal_centavos).sort()).toEqual([200000, 50000].sort());
    expect(venta.pagos).toEqual([
      expect.objectContaining({ medio: 'efectivo', monto_centavos: 250000 }),
    ]);
    expect(await registrosDe(id!)).toContainEqual(expect.objectContaining({ accion: 'alta' }));
  });

  it('rechaza un dia futuro y una venta sin renglones', async () => {
    const manana = sumarMeses(HOY, 1);
    expect((await guardar('admin', datosDeVenta(manana, cheaf, dosRenglones()))).error?.code).toBe(
      'PV301',
    );
    expect((await guardar('admin', datosDeVenta(HOY, cheaf, []))).error?.code).toBe('PV302');
  });

  it('rechaza un canal desactivado o de otro local', async () => {
    const apagado = await sembrarCanal(false);
    canales.push(apagado.id);
    expect(
      (await guardar('admin', datosDeVenta(HOY, apagado.id, dosRenglones()))).error?.code,
    ).toBe('PV303');
    const ajeno = await idDeCanal('Cheaf', true);
    expect((await guardar('admin', datosDeVenta(HOY, ajeno, dosRenglones()))).error?.code).toBe(
      'PV303',
    );
  });

  it('rechaza un producto desactivado', async () => {
    const apagado = await productoParaVender(false);
    categoriasDelMenu.push(apagado.categoriaId);
    const renglones = [{ producto: apagado, cantidad: 1, precioCentavos: 100 }];
    expect((await guardar('admin', datosDeVenta(HOY, cheaf, renglones))).error?.code).toBe('PV304');
  });

  it.each(['caja', 'invitado', 'encargado'] as RolDePrueba[])(
    '%s no guarda ventas',
    async (rol) => {
      expect((await guardar(rol, datosDeVenta(HOY, cheaf, dosRenglones()))).error?.code).toBe(
        '42501',
      );
    },
  );
});

describe('anular', () => {
  async function anular(id: string, cambios: Record<string, unknown>) {
    return (await clienteComo('admin'))
      .from('ventas')
      .update(cambios as never)
      .eq('id', id);
  }

  it('pide motivo, anota quien y cuando, y la deja cerrada', async () => {
    const { data: id } = await guardar('admin', datosDeVenta(HOY, cheaf, dosRenglones()));
    expect((await anular(id!, { anulado: true })).error?.code).toBe('PV306');
    expect(
      (await anular(id!, { anulado: true, motivo_anulacion: 'Cargada dos veces' })).error,
    ).toBeNull();
    const venta = await ventaDe(id!);
    expect(venta).toMatchObject({ anulado: true, anulado_por: await idDeCuentaDePrueba('admin') });
    expect(venta.fecha_anulacion).not.toBeNull();
    expect((await anular(id!, { anulado: false })).error?.code).toBe('PV305');
  });

  it('una venta de Fudo no se anula desde el sistema', async () => {
    const deFudo = await sembrarVenta({ origen: 'fudo' });
    ventas.push(deFudo.id);
    expect((await anular(deFudo.id, { anulado: true, motivo_anulacion: 'x' })).error?.code).toBe(
      'PV307',
    );
  });
});

describe('canales', () => {
  it('dos canales no se llaman igual en un local', async () => {
    const { error } = await (
      await clienteComo('admin')
    )
      .from('canales_de_venta')
      .insert({ nombre: 'CHEAF' });
    expect(error?.code).toBe('23505');
  });
});

describe('la misma venta mandada dos veces', () => {
  it('con la misma clave de carga devuelve la misma venta y no crea otra', async () => {
    const clave = crypto.randomUUID();
    const datos = datosDeVenta(HOY, cheaf, dosRenglones(), { clave });
    const primera = await guardar('admin', datos);
    const segunda = await guardar('admin', datos);
    expect(segunda.error).toBeNull();
    expect(segunda.data).toBe(primera.data);
    const { count } = await clienteSecretoDePruebas()
      .from('ventas')
      .select('id', { count: 'exact', head: true })
      .eq('clave', clave);
    expect(count).toBe(1);
  });
});

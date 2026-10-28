import { afterAll, describe, expect, it } from 'vitest';
import { diaEnArgentina } from '../../src/lib/fechas';
import { sumarMeses } from '../../src/lib/gastos/vencimientos';
import type { Json } from '../../src/lib/supabase/tipos';
import { clienteSecretoDePruebas } from '../clientes';
import type { RolDePrueba } from '../cuentas';
import { clienteComo } from '../sesiones';
import { borrarVentas } from '../ventas-de-prueba';

// Dias de 2020: ninguna venta de demostracion ni de otro test cae ahi.
const DIA = '2020-03-02';
const OTRO_DIA = '2020-03-03';

afterAll(async () => {
  const { data } = await clienteSecretoDePruebas()
    .from('ventas')
    .select('id')
    .like('fudo_id', 'excel:2020-03-%');
  await borrarVentas((data ?? []).map((v) => v.id));
});

const lote = (fecha: string, medio: string, montos: number[]) => ({ fecha, medio, montos });

async function subir(rol: RolDePrueba, lotes: Json) {
  return (await clienteComo(rol)).rpc('ventas_importar_excel', { lotes });
}

async function ventasDe(fecha: string, medio: string) {
  const { data, error } = await clienteSecretoDePruebas()
    .from('ventas')
    .select('*, pagos:pagos_de_venta(*)')
    .like('fudo_id', `excel:${fecha}:${medio}:%`)
    .order('fecha_creacion')
    .order('id');
  if (error) throw new Error(error.message);
  return data;
}

describe('subir el Excel de Fudo', () => {
  it('crea una venta de Fudo por cada monto, cerrada, con su pago y sin productos', async () => {
    const { data, error } = await subir('admin', [lote(DIA, 'efectivo', [334, 333, 333])]);
    expect(error).toBeNull();
    expect(data).toEqual({ nuevas: 3, actualizadas: 0, iguales: 0, anuladas: 0 });
    const ventas = await ventasDe(DIA, 'efectivo');
    expect(ventas.map((v) => v.total_centavos).sort()).toEqual([333, 333, 334]);
    expect(
      ventas.every(
        (v) => v.origen === 'fudo' && v.estado === 'cerrada' && v.fecha === DIA && !v.anulado,
      ),
    ).toBe(true);
    expect(ventas.flatMap((v) => v.pagos).every((p) => p.medio === 'efectivo')).toBe(true);
    expect(ventas.map((v) => v.pagos[0]!.monto_centavos).sort()).toEqual([333, 333, 334]);
  });

  it('subir lo mismo otra vez no duplica nada', async () => {
    const { data } = await subir('admin', [lote(DIA, 'efectivo', [334, 333, 333])]);
    expect(data).toEqual({ nuevas: 0, actualizadas: 0, iguales: 3, anuladas: 0 });
    expect(await ventasDe(DIA, 'efectivo')).toHaveLength(3);
  });

  it('si Fudo cambio el total, actualiza el monto de la venta y de su pago', async () => {
    const { data } = await subir('admin', [lote(DIA, 'efectivo', [500, 400, 300])]);
    expect(data).toEqual({ nuevas: 0, actualizadas: 3, iguales: 0, anuladas: 0 });
    const ventas = await ventasDe(DIA, 'efectivo');
    expect(ventas.map((v) => v.total_centavos)).toEqual([500, 400, 300]);
    expect(ventas.map((v) => v.pagos[0]!.monto_centavos)).toEqual([500, 400, 300]);
  });

  it('si hay menos ventas que antes, anula las que sobran con motivo y no las borra', async () => {
    const { data } = await subir('admin', [lote(DIA, 'efectivo', [700])]);
    expect(data).toEqual({ nuevas: 0, actualizadas: 1, iguales: 0, anuladas: 2 });
    const ventas = await ventasDe(DIA, 'efectivo');
    expect(ventas).toHaveLength(3);
    const anuladas = ventas.filter((v) => v.anulado);
    expect(anuladas).toHaveLength(2);
    expect(anuladas.map((v) => v.motivo_anulacion)).toEqual(
      Array(2).fill('Reemplazada por una nueva subida del Excel de Fudo'),
    );
    expect(ventas.filter((v) => !v.anulado).map((v) => v.total_centavos)).toEqual([700]);
  });

  it('si despues vuelven a ser mas, crea las que faltan sin tocar las anuladas', async () => {
    const { data } = await subir('admin', [lote(DIA, 'efectivo', [100, 200, 300])]);
    expect(data).toEqual({ nuevas: 2, actualizadas: 1, iguales: 0, anuladas: 0 });
    const vigentes = (await ventasDe(DIA, 'efectivo')).filter((v) => !v.anulado);
    expect(vigentes.map((v) => v.total_centavos).sort()).toEqual([100, 200, 300]);
  });

  it('cada medio y cada dia son independientes', async () => {
    const lotes = [lote(DIA, 'qr', [900]), lote(OTRO_DIA, 'efectivo', [50, 50])];
    expect((await subir('admin', lotes)).data).toEqual({
      nuevas: 3,
      actualizadas: 0,
      iguales: 0,
      anuladas: 0,
    });
    expect(await ventasDe(DIA, 'qr')).toHaveLength(1);
    expect(await ventasDe(OTRO_DIA, 'efectivo')).toHaveLength(2);
    expect((await ventasDe(DIA, 'efectivo')).filter((v) => !v.anulado)).toHaveLength(3);
  });

  it('queda en la auditoria quien cargo las ventas', async () => {
    const [venta] = await ventasDe(DIA, 'qr');
    const { data } = await clienteSecretoDePruebas()
      .from('auditoria')
      .select('accion, tabla')
      .eq('registro_id', venta!.id);
    expect(data).toContainEqual({ accion: 'alta', tabla: 'ventas' });
  });
});

describe('lo que la subida rechaza', () => {
  const codigo = async (lotes: Json) => (await subir('admin', lotes)).error?.code;

  it('un dia que todavia no llego', async () => {
    const manana = sumarMeses(diaEnArgentina(new Date()), 1);
    expect(await codigo([lote(manana, 'qr', [100])])).toBe('PV301');
  });

  it.each([
    ['sin lotes', []],
    ['un medio que no existe', [lote(DIA, 'cheque', [100])]],
    ['sin montos', [lote(DIA, 'qr', [])]],
    ['un monto negativo', [lote(DIA, 'qr', [-1])]],
    ['un monto con decimales', [lote(DIA, 'qr', [10.5])]],
    ['el mismo dia y medio dos veces', [lote(DIA, 'qr', [1]), lote(DIA, 'qr', [2])]],
    ['mas de 5.000 ventas por dia y medio', [lote(DIA, 'qr', new Array(5001).fill(1))]],
  ] as [string, Json][])('%s', async (_, lotes) => {
    expect(await codigo(lotes)).toBe('PV308');
  });

  it.each(['caja', 'invitado', 'encargado'] as RolDePrueba[])('%s no sube nada', async (rol) => {
    expect((await subir(rol, [lote(DIA, 'qr', [100])])).error?.code).toBe('42501');
  });

  it('una venta de Fudo cargada por la subida sigue sin anularse a mano', async () => {
    const [venta] = await ventasDe(DIA, 'qr');
    const { error } = await (
      await clienteComo('admin')
    )
      .from('ventas')
      .update({ anulado: true, motivo_anulacion: 'x' })
      .eq('id', venta!.id);
    expect(error?.code).toBe('PV307');
  });
});

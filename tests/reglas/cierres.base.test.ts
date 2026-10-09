import { afterAll, describe, expect, it } from 'vitest';
import { diaEnArgentina } from '../../src/lib/fechas';
import { sumarMeses } from '../../src/lib/gastos/vencimientos';
import type { Json } from '../../src/lib/supabase/tipos';
import {
  borrarCierres,
  cierreDe,
  datosDeCierre,
  diaLibre,
  gastosDelCierre,
  sembrarCierre,
} from '../cierres-de-prueba';
import { clienteSecretoDePruebas } from '../clientes';
import { idDeCuentaDePrueba, registrosDe } from '../consultas-de-prueba';
import type { RolDePrueba } from '../cuentas';
import { idDeCategoria } from '../gastos-de-prueba';
import { clienteComo } from '../sesiones';

const cierres: string[] = [];
afterAll(() => borrarCierres(cierres));

async function guardar(rol: RolDePrueba, datos: Json) {
  const respuesta = await (await clienteComo(rol)).rpc('cierres_guardar', { datos });
  if (respuesta.data) cierres.push(respuesta.data);
  return respuesta;
}

async function cambiar(id: string, cambios: Record<string, unknown>) {
  return (await clienteComo('admin'))
    .from('cierres_de_caja')
    .update(cambios as never)
    .eq('id', id);
}

describe('guardar un cierre', () => {
  it('queda a nombre de caja, con sus retiros y un gasto sin clasificar por gasto de caja', async () => {
    const fecha = diaLibre();
    const { data: id, error } = await guardar('caja', datosDeCierre(fecha));
    expect(error).toBeNull();
    const caja = await idDeCuentaDePrueba('caja');
    expect(await cierreDe(id!)).toMatchObject({
      cargado_por: caja,
      estado: 'esperando_ventas',
      efectivo_centavos: 2500050,
    });
    const { data: retiros } = await clienteSecretoDePruebas()
      .from('retiros_de_caja')
      .select('monto_centavos, quien')
      .eq('cierre_id', id!);
    expect(retiros).toEqual([{ monto_centavos: 500000, quien: 'Dueño' }]);
    expect(await gastosDelCierre(id!)).toEqual([
      expect.objectContaining({
        monto_centavos: 120000,
        descripcion: 'Hielo',
        medio_de_pago: 'efectivo_caja',
        fecha,
        creado_por: caja,
        categoria_id: await idDeCategoria('Sin clasificar'),
      }),
    ]);
    expect(await registrosDe(id!)).toContainEqual(expect.objectContaining({ accion: 'alta' }));
  });

  it('no acepta un dia futuro', async () => {
    const manana = sumarMeses(diaEnArgentina(new Date()), 1);
    expect((await guardar('caja', datosDeCierre(manana))).error?.code).toBe('PC301');
  });

  it('uno por dia, y el anulado deja libre el dia', async () => {
    const fecha = diaLibre();
    const primero = await guardar('caja', datosDeCierre(fecha));
    expect((await guardar('admin', datosDeCierre(fecha))).error?.code).toBe('PC302');
    await cambiar(primero.data!, { anulado: true, motivo_anulacion: 'Mal contado' });
    expect((await guardar('caja', datosDeCierre(fecha))).error).toBeNull();
  });

  it.each(['invitado', 'encargado', 'desactivado'] as RolDePrueba[])(
    '%s no guarda cierres',
    async (rol) => {
      expect((await guardar(rol, datosDeCierre(diaLibre()))).error?.code).toBe('42501');
    },
  );

  it('sin retiros ni gastos tambien se guarda', async () => {
    const datos = datosDeCierre(diaLibre(), { retiros: [], gastos: [] });
    const { data: id, error } = await guardar('caja', datos);
    expect(error).toBeNull();
    expect(await gastosDelCierre(id!)).toEqual([]);
  });
});

describe('revisar y anular', () => {
  it('revisar anota quien y cuando', async () => {
    const { id } = await sembrarCierre();
    cierres.push(id);
    expect((await cambiar(id, { revisado: true, comentario_revision: 'Ok' })).error).toBeNull();
    const fila = await cierreDe(id);
    expect(fila).toMatchObject({
      estado: 'revisado',
      revisado_por: await idDeCuentaDePrueba('admin'),
    });
    expect(fila.fecha_revision).not.toBeNull();
  });

  it('anular pide motivo, anula sus gastos y lo deja cerrado', async () => {
    const { data: id } = await guardar('caja', datosDeCierre(diaLibre()));
    expect((await cambiar(id!, { anulado: true })).error?.code).toBe('PC304');
    expect(
      (await cambiar(id!, { anulado: true, motivo_anulacion: 'Mal contado' })).error,
    ).toBeNull();
    expect(await cierreDe(id!)).toMatchObject({
      estado: 'anulado',
      anulado_por: await idDeCuentaDePrueba('admin'),
    });
    expect((await gastosDelCierre(id!)).every((g) => g.anulado)).toBe(true);
    expect((await cambiar(id!, { revisado: true })).error?.code).toBe('PC303');
  });
});

describe('el gasto que sale de un cierre', () => {
  it('se clasifica, pero no cambia su monto ni se anula suelto', async () => {
    const { data: id } = await guardar('caja', datosDeCierre(diaLibre()));
    const [gasto] = await gastosDelCierre(id!);
    const admin = await clienteComo('admin');
    const alquiler = await idDeCategoria('Alquiler');
    const clasificar = await admin
      .from('gastos')
      .update({ categoria_id: alquiler, descripcion: 'Hielo para la vitrina' })
      .eq('id', gasto!.id);
    expect(clasificar.error).toBeNull();
    const monto = await admin.from('gastos').update({ monto_centavos: 1 }).eq('id', gasto!.id);
    expect(monto.error?.code).toBe('PC305');
    const anular = await admin
      .from('gastos')
      .update({ anulado: true, motivo_anulacion: 'x' })
      .eq('id', gasto!.id);
    expect(anular.error?.code).toBe('PC306');
  });
});

describe('fondo sugerido', () => {
  it('es lo que quedo en la caja en el ultimo cierre antes de esa fecha', async () => {
    const { id, fecha } = await sembrarCierre({ quedaEnCajaCentavos: 777700 });
    cierres.push(id);
    const siguiente = new Date(Date.parse(`${fecha}T12:00:00Z`) + 86400000)
      .toISOString()
      .slice(0, 10);
    const { data } = await (
      await clienteComo('caja')
    ).rpc('cierres_fondo_sugerido', {
      la_fecha: siguiente,
    });
    expect(data).toBe(777700);
  });
});

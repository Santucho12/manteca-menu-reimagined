import { afterAll, describe, expect, it } from 'vitest';
import {
  borrarCierres,
  borrarDiasSinAbrir,
  datosDeCierre,
  diaLibre,
  diaSinAbrirDe,
  sembrarCierre,
} from '../cierres-de-prueba';
import { clienteSecretoDePruebas } from '../clientes';
import { idDeCuentaDePrueba } from '../consultas-de-prueba';
import type { RolDePrueba } from '../cuentas';
import { clienteComo } from '../sesiones';

const FUTURO = '2099-01-01';
const fechas: string[] = [FUTURO];
const cierres: string[] = [];
afterAll(async () => {
  await borrarCierres(cierres);
  await borrarDiasSinAbrir(fechas);
});

function dia(): string {
  const fecha = diaLibre();
  fechas.push(fecha);
  return fecha;
}

async function marcar(rol: RolDePrueba, fecha: string, marcar = true) {
  const cliente = await clienteComo(rol);
  return cliente.rpc('cierres_marcar_sin_abrir', { la_fecha: fecha, marcar });
}

async function anular(id: string) {
  const admin = await clienteComo('admin');
  await admin
    .from('cierres_de_caja')
    .update({ anulado: true, motivo_anulacion: 'Prueba' })
    .eq('id', id);
}

async function accionesDe(fecha: string): Promise<string[]> {
  const marca = await diaSinAbrirDe(fecha);
  const { data } = await clienteSecretoDePruebas()
    .from('auditoria')
    .select('accion')
    .eq('tabla', 'dias_sin_abrir')
    .eq('registro_id', marca!.id)
    .order('id');
  return (data ?? []).map((registro) => registro.accion);
}

describe('cierres_marcar_sin_abrir', () => {
  it('el admin marca un dia y queda activo, a su nombre', async () => {
    const fecha = dia();
    expect((await marcar('admin', fecha)).error).toBeNull();
    expect(await diaSinAbrirDe(fecha)).toMatchObject({
      activo: true,
      marcado_por: await idDeCuentaDePrueba('admin'),
    });
  });

  it('marcar dos veces el mismo dia no falla ni duplica', async () => {
    const fecha = dia();
    await marcar('admin', fecha);
    expect((await marcar('admin', fecha)).error).toBeNull();
    expect((await diaSinAbrirDe(fecha))?.activo).toBe(true);
  });

  it('deshacer lo desactiva y volver a marcar lo reactiva', async () => {
    const fecha = dia();
    await marcar('admin', fecha);
    expect((await marcar('admin', fecha, false)).error).toBeNull();
    expect((await diaSinAbrirDe(fecha))?.activo).toBe(false);
    await marcar('admin', fecha);
    expect((await diaSinAbrirDe(fecha))?.activo).toBe(true);
  });

  it('no marca un dia que todavia no llego', async () => {
    expect((await marcar('admin', FUTURO)).error?.code).toBe('PC308');
    expect(await diaSinAbrirDe(FUTURO)).toBeNull();
  });

  it('no marca un dia con cierre sin anular, y si con el cierre anulado', async () => {
    const fecha = dia();
    const { id } = await sembrarCierre({ fecha });
    cierres.push(id);
    expect((await marcar('admin', fecha)).error?.code).toBe('PC307');
    expect(await diaSinAbrirDe(fecha)).toBeNull();
    await anular(id);
    expect((await marcar('admin', fecha)).error).toBeNull();
  });

  it('cargar el cierre de un dia marcado desactiva la marca, y anulado ese cierre sigue asi', async () => {
    const fecha = dia();
    await marcar('admin', fecha);
    const caja = await clienteComo('caja');
    const { data: id, error } = await caja.rpc('cierres_guardar', { datos: datosDeCierre(fecha) });
    expect(error).toBeNull();
    cierres.push(id!);
    expect((await diaSinAbrirDe(fecha))?.activo).toBe(false);
    await anular(id!);
    expect((await diaSinAbrirDe(fecha))?.activo).toBe(false);
  });

  it('deja en la auditoria el alta, la desactivacion y la reactivacion', async () => {
    const fecha = dia();
    await marcar('admin', fecha);
    await marcar('admin', fecha, false);
    await marcar('admin', fecha);
    expect(await accionesDe(fecha)).toEqual(['alta', 'desactivacion', 'reactivacion']);
  });

  it.each(['caja', 'invitado', 'encargado', 'desactivado'] as const)('%s no marca', async (rol) => {
    const fecha = dia();
    expect((await marcar(rol, fecha)).error?.code).toBe('42501');
    expect(await diaSinAbrirDe(fecha)).toBeNull();
  });
});

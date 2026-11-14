import { afterAll, describe, expect, it } from 'vitest';
import { diasSinAbrir, marcarSinAbrir, MENSAJES_DE_SIN_ABRIR } from '../../src/lib/caja/sinAbrir';
import {
  borrarCierres,
  borrarDiasSinAbrir,
  diaLibre,
  idsDeCierresDe,
  sembrarCierre,
} from '../cierres-de-prueba';
import { clienteComo } from '../sesiones';

const fechas: string[] = [];
afterAll(async () => {
  await borrarCierres(await idsDeCierresDe(fechas));
  await borrarDiasSinAbrir(fechas);
});

function dia(): string {
  const fecha = diaLibre();
  fechas.push(fecha);
  return fecha;
}

describe('dias que el local no abrio', () => {
  it('el admin marca un dia y se lee; al deshacer ya no', async () => {
    const fecha = dia();
    const admin = await clienteComo('admin');
    expect((await marcarSinAbrir(admin, fecha, true)).ok).toBe(true);
    expect(await diasSinAbrir(admin, fecha, fecha)).toEqual([fecha]);
    expect((await marcarSinAbrir(admin, fecha, false)).ok).toBe(true);
    expect(await diasSinAbrir(admin, fecha, fecha)).toEqual([]);
  });

  it('un dia con cierre cargado no se marca, y explica por que', async () => {
    const fecha = dia();
    await sembrarCierre({ fecha });
    const resultado = await marcarSinAbrir(await clienteComo('admin'), fecha, true);
    expect(resultado).toEqual({ ok: false, mensaje: MENSAJES_DE_SIN_ABRIR.conCierre });
  });

  it('un dia que todavia no llego no se marca, y explica por que', async () => {
    const resultado = await marcarSinAbrir(await clienteComo('admin'), '2099-01-01', true);
    expect(resultado).toEqual({ ok: false, mensaje: MENSAJES_DE_SIN_ABRIR.diaFuturo });
  });

  it('caja no marca ni lee los dias sin abrir', async () => {
    const fecha = dia();
    await marcarSinAbrir(await clienteComo('admin'), fecha, true);
    const caja = await clienteComo('caja');
    expect(await marcarSinAbrir(caja, fecha, false)).toEqual({
      ok: false,
      mensaje: MENSAJES_DE_SIN_ABRIR.sinPermiso,
    });
    expect(await diasSinAbrir(caja, fecha, fecha)).toEqual([]);
  });
});

import { afterAll, describe, expect, it } from 'vitest';
import {
  cierrePorId,
  diasConCierre,
  fondoSugerido,
  listarCierres,
  misCierres,
  personasDeCaja,
  toleranciaDeCaja,
} from '../../src/lib/caja/consultas';
import {
  anularCierre,
  cambiarTolerancia,
  guardarCierre,
  MENSAJES_DE_CAJA,
  revisarCierre,
} from '../../src/lib/caja/escritura';
import type { DatosDeCierre } from '../../src/lib/caja/esquemas';
import type { FiltrosDeControl } from '../../src/lib/caja/pantalla';
import { diaEnArgentina } from '../../src/lib/fechas';
import { gastoPorId } from '../../src/lib/gastos/consultas';
import { editarGasto, MENSAJES_DE_GASTOS } from '../../src/lib/gastos/escritura';
import { datosDeGastoParaEditar } from '../../src/lib/gastos/esquemas';
import { sumarMeses } from '../../src/lib/gastos/vencimientos';
import { borrarCierres, diaLibre, gastosDelCierre, sembrarCierre } from '../cierres-de-prueba';
import { idDeCuentaDePrueba } from '../consultas-de-prueba';
import { clienteComo } from '../sesiones';

const cierres: string[] = [];
afterAll(async () => {
  await borrarCierres(cierres);
  await cambiarTolerancia(await clienteComo('admin'), 50000);
});

const datos = (fecha: string, cambios: Partial<DatosDeCierre> = {}): DatosDeCierre => ({
  fecha,
  fondoInicial: '10.000',
  efectivo: '25.000,50',
  credito: '3.000',
  debito: '',
  qr: '',
  transferencia: '1.500',
  quedaEnCaja: '8.000',
  comentario: 'Todo normal',
  retiros: [{ monto: '5.000', quien: 'Dueño' }],
  gastos: [{ monto: '1.200', descripcion: 'Hielo' }],
  ...cambios,
});

async function guardarComo(rol: 'caja' | 'admin', fecha: string) {
  const resultado = await guardarCierre(await clienteComo(rol), datos(fecha));
  if (!resultado.ok) throw new Error(resultado.mensaje);
  cierres.push(resultado.datos.id);
  return resultado.datos.id;
}

const filtros = (fecha: string, cambios: Partial<FiltrosDeControl> = {}): FiltrosDeControl => ({
  desde: fecha,
  hasta: fecha,
  personaId: null,
  estado: null,
  pagina: 1,
  ...cambios,
});

describe('guardar un cierre', () => {
  it('caja lo guarda y lo lee completo, con retiros y gastos', async () => {
    const fecha = diaLibre();
    const id = await guardarComo('caja', fecha);
    const cierre = await cierrePorId(await clienteComo('caja'), id);
    expect(cierre).toMatchObject({
      fecha,
      estado: 'esperando_ventas',
      efectivo_centavos: 2500050,
      queda_en_caja_centavos: 800000,
      comentario: 'Todo normal',
      retiros: [{ monto_centavos: 500000, quien: 'Dueño' }],
      gastos: [{ monto_centavos: 120000, descripcion: 'Hielo', anulado: false }],
    });
  });

  it('explica el dia repetido y el dia futuro', async () => {
    const fecha = diaLibre();
    await guardarComo('caja', fecha);
    const caja = await clienteComo('caja');
    expect(await guardarCierre(caja, datos(fecha))).toEqual({
      ok: false,
      mensaje: MENSAJES_DE_CAJA.diaRepetido,
    });
    const futuro = sumarMeses(diaEnArgentina(new Date()), 1);
    expect(await guardarCierre(caja, datos(futuro))).toEqual({
      ok: false,
      mensaje: MENSAJES_DE_CAJA.diaFuturo,
    });
  });

  it('un invitado no guarda', async () => {
    const resultado = await guardarCierre(await clienteComo('invitado'), datos(diaLibre()));
    expect(resultado).toEqual({ ok: false, mensaje: MENSAJES_DE_CAJA.sinPermiso });
  });

  it('el fondo sugerido es lo que quedo el dia anterior', async () => {
    const { id, fecha } = await sembrarCierre({ quedaEnCajaCentavos: 432100 });
    cierres.push(id);
    const siguiente = new Date(Date.parse(`${fecha}T12:00:00Z`) + 86400000)
      .toISOString()
      .slice(0, 10);
    expect(await fondoSugerido(await clienteComo('caja'), siguiente)).toBe(432100);
  });
});

describe('listas', () => {
  it('caja ve los suyos; el control filtra por dia, persona y estado', async () => {
    const fecha = diaLibre();
    const id = await guardarComo('caja', fecha);
    const caja = await idDeCuentaDePrueba('caja');
    expect((await misCierres(await clienteComo('caja'), caja)).map((c) => c.id)).toContain(id);
    const admin = await clienteComo('admin');
    const delDia = await listarCierres(admin, filtros(fecha));
    expect(delDia.filas).toEqual([
      expect.objectContaining({ id, fecha, estado: 'esperando_ventas', persona: 'Prueba Caja' }),
    ]);
    expect(delDia.filas[0]!.diferenciaTotalCentavos).toBeNull();
    const deOtro = filtros(fecha, { personaId: await idDeCuentaDePrueba('admin') });
    expect((await listarCierres(admin, deOtro)).filas).toEqual([]);
    expect((await listarCierres(admin, filtros(fecha, { estado: 'revisado' }))).filas).toEqual([]);
    expect(await diasConCierre(admin, fecha, fecha)).toEqual([fecha]);
    expect((await personasDeCaja(admin)).map((p) => p.nombre)).toContain('Prueba Caja');
  });

  it('caja no lee un cierre ajeno', async () => {
    const id = await guardarComo('admin', diaLibre());
    expect(await cierrePorId(await clienteComo('caja'), id)).toBeNull();
    expect(await cierrePorId(await clienteComo('caja'), 'no-es-un-id')).toBeNull();
  });
});

describe('revisar, anular y tolerancia', () => {
  it('el admin revisa con comentario', async () => {
    const id = await guardarComo('caja', diaLibre());
    const admin = await clienteComo('admin');
    expect((await revisarCierre(admin, id, 'Lo vi')).ok).toBe(true);
    expect(await cierrePorId(admin, id)).toMatchObject({
      estado: 'revisado',
      comentario_revision: 'Lo vi',
    });
  });

  it('anular anula sus gastos; caja no puede', async () => {
    const id = await guardarComo('caja', diaLibre());
    expect(await anularCierre(await clienteComo('caja'), id, 'x')).toEqual({
      ok: false,
      mensaje: MENSAJES_DE_CAJA.noDisponible,
    });
    const admin = await clienteComo('admin');
    expect((await anularCierre(admin, id, 'Mal contado')).ok).toBe(true);
    expect((await gastosDelCierre(id)).every((g) => g.anulado)).toBe(true);
    expect(await revisarCierre(admin, id, '')).toEqual({
      ok: false,
      mensaje: MENSAJES_DE_CAJA.anulado,
    });
  });

  it('el admin cambia la tolerancia', async () => {
    const admin = await clienteComo('admin');
    expect((await cambiarTolerancia(admin, 123400)).ok).toBe(true);
    expect(await toleranciaDeCaja(admin)).toBe(123400);
  });
});

describe('el gasto de un cierre, desde Gastos', () => {
  it('avisa que su monto se corrige anulando el cierre', async () => {
    const id = await guardarComo('caja', diaLibre());
    const [fila] = await gastosDelCierre(id);
    const admin = await clienteComo('admin');
    const gasto = await gastoPorId(admin, fila!.id);
    expect(gasto?.cierre_id).toBe(id);
    const cambiado = { ...datosDeGastoParaEditar(gasto!), monto: '1' };
    expect(await editarGasto(admin, gasto!.id, cambiado)).toEqual({
      ok: false,
      mensaje: MENSAJES_DE_GASTOS.deCierre,
    });
  });
});

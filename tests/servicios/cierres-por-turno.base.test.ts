import { afterEach, describe, expect, it } from 'vitest';
import { fondoSugerido } from '../../src/lib/caja/consultas';
import {
  horasDeCierreDelLocal,
  postergacionesDelCierre,
  turnosPendientes,
} from '../../src/lib/caja/consultasDeTurnos';
import {
  cambiarHorasDeCierre,
  guardarCierre,
  MENSAJES_DE_CAJA,
} from '../../src/lib/caja/escritura';
import type { DatosDeCierre } from '../../src/lib/caja/esquemas';
import { diaEnArgentina } from '../../src/lib/fechas';
import { estadoDelMostrador } from '../../src/lib/vender/consultas';
import { MENSAJES_DEL_MOSTRADOR, postergarCierre } from '../../src/lib/vender/escritura';
import {
  borrarCierres,
  borrarPostergaciones,
  diaLibre,
  diaSiguiente,
  horasDeCierre,
  restaurarHorasDeCierre,
  sembrarCierre,
} from '../cierres-de-prueba';
import { clienteComo } from '../sesiones';
import { borrarVentas, sembrarVentaConPago } from '../ventas-de-prueba';

const HOY = diaEnArgentina(new Date());
const cierres: string[] = [];
const ventas: string[] = [];

afterEach(async () => {
  await restaurarHorasDeCierre();
  await borrarVentas(ventas.splice(0));
  await borrarCierres(cierres.splice(0));
  await borrarPostergaciones([HOY]);
});

const datos = (fecha: string, turno: '1' | '2'): DatosDeCierre => ({
  fecha,
  turno,
  fondoInicial: '10.000',
  efectivo: '20.000',
  credito: '',
  debito: '',
  qr: '',
  transferencia: '',
  quedaEnCaja: '10.000',
  comentario: '',
  retiros: [],
  gastos: [],
  controles: [],
});

async function guardar(fecha: string, turno: '1' | '2') {
  const resultado = await guardarCierre(await clienteComo('caja'), datos(fecha, turno));
  if (resultado.ok) cierres.push(resultado.datos.id);
  return resultado;
}

async function trabarElMediodia() {
  ventas.push(
    await sembrarVentaConPago({ fecha: HOY, turno: 1, medio: 'efectivo', centavos: 1000 }),
  );
  const hace = new Date(Date.now() - 60_000).toLocaleTimeString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  await horasDeCierre(hace, '23:59');
}

describe('guardar el cierre de un turno', () => {
  it('el segundo del mismo turno avisa que ya hay uno para ese turno', async () => {
    const fecha = diaLibre();
    await guardar(fecha, '1');
    expect(await guardar(fecha, '1')).toEqual({
      ok: false,
      mensaje: MENSAJES_DE_CAJA.turnoRepetido,
    });
    expect((await guardar(fecha, '2')).ok).toBe(true);
  });

  it('la noche de hoy pide antes el cierre del mediodía', async () => {
    ventas.push(
      await sembrarVentaConPago({ fecha: HOY, turno: 1, medio: 'efectivo', centavos: 1000 }),
    );
    expect(await guardar(HOY, '2')).toEqual({
      ok: false,
      mensaje: MENSAJES_DE_CAJA.primeroElMediodia,
    });
  });

  it('el fondo sugerido de la noche es lo que dejó el mediodía', async () => {
    const fecha = diaLibre();
    cierres.push((await sembrarCierre({ fecha, turno: 1, quedaEnCajaCentavos: 43200 })).id);
    expect(await fondoSugerido(await clienteComo('caja'), fecha, 2)).toBe(43200);
  });
});

describe('el estado del mostrador y postergar', () => {
  it('caja lee el estado trabado y lo posterga', async () => {
    await trabarElMediodia();
    const caja = await clienteComo('caja');
    expect(await estadoDelMostrador(caja)).toMatchObject({
      trabado: true,
      motivo: 'hora',
      turnoTrabado: 1,
    });
    const postergado = await postergarCierre(caja);
    expect(postergado.ok).toBe(true);
    expect(await estadoDelMostrador(caja)).toMatchObject({ trabado: false, turnoTrabado: 1 });
  });

  it('sin nada que cerrar, postergar avisa', async () => {
    expect(await postergarCierre(await clienteComo('caja'))).toEqual({
      ok: false,
      mensaje: MENSAJES_DEL_MOSTRADOR.nadaParaPostergar,
    });
  });

  it('el detalle del cierre cuenta las postergaciones', async () => {
    await trabarElMediodia();
    const caja = await clienteComo('caja');
    await postergarCierre(caja);
    await postergarCierre(caja);
    const resumen = await postergacionesDelCierre(await clienteComo('admin'), HOY, 1);
    expect(resumen).toMatchObject({ veces: 2 });
    expect(resumen?.minutos).toBeGreaterThanOrEqual(10);
  });
});

describe('los turnos pendientes y las horas', () => {
  it('el admin ve el turno con ventas y sin cierre', async () => {
    const ayer = diaSiguiente(HOY, -1);
    ventas.push(await sembrarVentaConPago({ fecha: ayer, turno: 2, medio: 'qr', centavos: 500 }));
    expect(await turnosPendientes(await clienteComo('admin'), ayer, ayer)).toEqual([
      { fecha: ayer, turno: 2 },
    ]);
  });

  it('el admin cambia las horas y las lee', async () => {
    const admin = await clienteComo('admin');
    expect((await cambiarHorasDeCierre(admin, { mediodia: '15:30', noche: '22:45' })).ok).toBe(
      true,
    );
    expect(await horasDeCierreDelLocal(admin)).toEqual({ mediodia: '15:30', noche: '22:45' });
  });

  it('caja no cambia las horas', async () => {
    const caja = await clienteComo('caja');
    expect(await cambiarHorasDeCierre(caja, { mediodia: '10:00', noche: '22:00' })).toEqual({
      ok: false,
      mensaje: MENSAJES_DE_CAJA.sinPermiso,
    });
  });
});

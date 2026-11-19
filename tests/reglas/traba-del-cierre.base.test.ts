import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { diaEnArgentina } from '../../src/lib/fechas';
import {
  borrarCierres,
  borrarDiasSinAbrir,
  borrarPostergaciones,
  diaSiguiente,
  horasDeCierre,
  restaurarHorasDeCierre,
  sembrarCierre,
  sembrarDiaSinAbrir,
} from '../cierres-de-prueba';
import type { RolDePrueba } from '../cuentas';
import { clienteComo } from '../sesiones';
import {
  borrarVentas,
  productoParaVender,
  sembrarVentaConPago,
  type ParaVender,
} from '../ventas-de-prueba';

const HOY = diaEnArgentina(new Date());
const AYER = diaSiguiente(HOY, -1);
const cierres: string[] = [];
const ventas: string[] = [];
const categorias: string[] = [];
let producto: ParaVender;

beforeAll(async () => {
  producto = await productoParaVender();
  categorias.push(producto.categoriaId);
});

afterEach(async () => {
  await restaurarHorasDeCierre();
  await borrarVentas(ventas.splice(0));
  await borrarCierres(cierres.splice(0));
  await borrarPostergaciones([HOY, AYER]);
  await borrarDiasSinAbrir([AYER]);
});

afterAll(() => borrarVentas([], { categoriasDelMenu: categorias }));

/** La hora de Argentina corrida unos minutos, como 'HH:MM'. */
function horaArgentina(minutos: number): string {
  const momento = new Date(Date.now() + minutos * 60_000);
  return momento.toLocaleTimeString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
}

/** El mediodía ya pasó su hora; la noche todavía no. */
const pasoElMediodia = () => horasDeCierre(horaArgentina(-1), '23:59');

async function venta(fecha: string, turno: 1 | 2) {
  ventas.push(await sembrarVentaConPago({ fecha, turno, medio: 'efectivo', centavos: 100000 }));
}

async function cierre(fecha: string, turno: 1 | 2) {
  cierres.push((await sembrarCierre({ fecha, turno })).id);
}

async function vender(clave = crypto.randomUUID()) {
  const caja = await clienteComo('caja');
  const respuesta = await caja.rpc('ventas_guardar_mostrador', {
    datos: {
      clave,
      renglones: [
        {
          producto_id: producto.productoId,
          presentacion_id: producto.presentacionId,
          cantidad: 1,
          precio_centavos: 100000,
        },
      ],
      pagos: [{ medio: 'efectivo', monto_centavos: 100000 }],
    },
  });
  const id = (respuesta.data as { id: string } | null)?.id;
  if (id) ventas.push(id);
  return respuesta;
}

type Estado = {
  fecha: string;
  turno: number;
  trabado: boolean;
  motivo: string | null;
  fecha_trabada: string | null;
  turno_trabado: number | null;
  postergado_hasta: string | null;
};

async function estado(rol: RolDePrueba = 'caja', momento?: Date): Promise<Estado> {
  const cliente = await clienteComo(rol);
  const { data, error } = momento
    ? await cliente.rpc('caja_estado_del_turno', { momento: momento.toISOString() })
    : await cliente.rpc('caja_estado_del_mostrador');
  if (error) throw new Error(error.message);
  return (data as unknown as Estado[])[0]!;
}

const postergar = async (rol: RolDePrueba = 'caja') =>
  (await clienteComo(rol)).rpc('caja_postergar_cierre');

describe('a la hora del cierre', () => {
  it('con ventas en el mediodía y sin cierre, el mostrador se traba', async () => {
    await venta(HOY, 1);
    await pasoElMediodia();
    expect(await estado()).toMatchObject({ trabado: true, motivo: 'hora', turno_trabado: 1 });
    expect((await vender()).error?.code).toBe('PV314');
  });

  it('postergado, se vende y la venta queda en el mediodía', async () => {
    await venta(HOY, 1);
    await pasoElMediodia();
    expect((await postergar()).error).toBeNull();
    const { data, error } = await vender();
    expect(error).toBeNull();
    const id = (data as { id: string }).id;
    const admin = await clienteComo('admin');
    const { data: fila } = await admin.from('ventas').select('turno').eq('id', id).single();
    expect(fila?.turno).toBe(1);
  });

  it('la postergación vence a los 10 minutos', async () => {
    await venta(HOY, 1);
    await pasoElMediodia();
    await postergar();
    expect((await estado('caja', new Date(Date.now() + 9 * 60_000))).trabado).toBe(false);
    expect((await estado('caja', new Date(Date.now() + 11 * 60_000))).trabado).toBe(true);
  });

  it('sin ventas en el mediodía no se traba y la venta va a la noche', async () => {
    await pasoElMediodia();
    expect(await estado()).toMatchObject({ trabado: false, turno: 2 });
    expect((await vender()).error).toBeNull();
  });

  it('con el cierre del mediodía cargado, se vende en la noche', async () => {
    await venta(HOY, 1);
    await cierre(HOY, 1);
    await pasoElMediodia();
    expect(await estado()).toMatchObject({ trabado: false, turno: 2 });
  });

  it('la misma clave repetida devuelve la venta ya guardada aunque esté trabado', async () => {
    const clave = crypto.randomUUID();
    const primera = await vender(clave);
    await pasoElMediodia();
    const repetida = await vender(clave);
    expect(repetida.error).toBeNull();
    expect(repetida.data).toEqual(primera.data);
  });
});

describe('la caja de ayer sin cerrar', () => {
  it('traba hasta cargar el cierre de su último turno con ventas', async () => {
    await venta(AYER, 2);
    expect(await estado()).toMatchObject({
      trabado: true,
      motivo: 'ayer',
      fecha_trabada: AYER,
      turno_trabado: 2,
    });
    expect((await vender()).error?.code).toBe('PV314');
    await cierre(AYER, 2);
    expect((await estado()).trabado).toBe(false);
  });

  it('no traba si ayer quedó marcado como que no abrió', async () => {
    await venta(AYER, 1);
    await sembrarDiaSinAbrir({ fecha: AYER });
    expect((await estado()).trabado).toBe(false);
  });
});

describe('después del cierre de la noche', () => {
  it('no se vende hasta mañana', async () => {
    await cierre(HOY, 1);
    await cierre(HOY, 2);
    expect(await estado()).toMatchObject({ trabado: true, motivo: 'cerrada' });
    expect((await vender()).error?.code).toBe('PV315');
  });
});

describe('postergar', () => {
  it('sin nada que cerrar, se rechaza', async () => {
    expect((await postergar()).error?.code).toBe('PC310');
  });

  it('cada toque es una fila, y vale el último', async () => {
    await venta(HOY, 1);
    await pasoElMediodia();
    await postergar();
    const segunda = await postergar();
    const admin = await clienteComo('admin');
    const { data } = await admin
      .from('postergaciones_de_cierre')
      .select('hasta')
      .eq('fecha', HOY)
      .order('hasta');
    expect(data).toHaveLength(2);
    expect(Date.parse(String(segunda.data))).toBe(Date.parse(data![1]!.hasta));
  });

  it('el admin también posterga', async () => {
    await venta(HOY, 1);
    await pasoElMediodia();
    expect((await postergar('admin')).error).toBeNull();
  });
});

describe('el estado no muestra plata', () => {
  it('ninguna columna es un monto', async () => {
    const columnas = Object.keys(await estado());
    expect(columnas.filter((c) => c.endsWith('_centavos'))).toEqual([]);
  });
});

describe('turnos pendientes', () => {
  async function pendientes(momento?: Date) {
    const admin = await clienteComo('admin');
    const { data, error } = await admin.rpc('cierres_turnos_pendientes', {
      desde: AYER,
      hasta: HOY,
      ...(momento ? { momento: momento.toISOString() } : {}),
    });
    if (error) throw new Error(error.message);
    return data as { fecha: string; turno: number }[];
  }

  it('un turno con ventas y sin cierre está pendiente; con cierre, no', async () => {
    await venta(AYER, 1);
    await venta(AYER, 2);
    await cierre(AYER, 2);
    expect(await pendientes()).toEqual([{ fecha: AYER, turno: 1 }]);
  });

  it('un turno de hoy cuenta recién pasada su hora', async () => {
    await venta(HOY, 1);
    expect(await pendientes()).toEqual([]);
    await pasoElMediodia();
    expect(await pendientes()).toEqual([{ fecha: HOY, turno: 1 }]);
  });

  it('un día marcado como que no abrió no tiene pendientes', async () => {
    await venta(AYER, 1);
    await sembrarDiaSinAbrir({ fecha: AYER });
    expect(await pendientes()).toEqual([]);
  });

  it('caja no los ve', async () => {
    const caja = await clienteComo('caja');
    const { error } = await caja.rpc('cierres_turnos_pendientes', { desde: AYER, hasta: HOY });
    expect(error?.code).toBe('42501');
  });
});

describe('las horas de cierre', () => {
  it('las cambia el admin y quedan en la auditoría', async () => {
    const admin = await clienteComo('admin');
    const { data, error } = await admin
      .from('configuracion_de_caja')
      .update({ hora_cierre_mediodia: '15:30', hora_cierre_noche: '22:45' })
      .not('id', 'is', null)
      .select('id, hora_cierre_mediodia');
    expect(error).toBeNull();
    expect(data?.[0]?.hora_cierre_mediodia).toBe('15:30:00');
    const { data: registros } = await admin
      .from('auditoria')
      .select('despues')
      .eq('registro_id', data![0]!.id)
      .order('fecha', { ascending: false })
      .limit(1);
    expect(registros?.[0]?.despues).toMatchObject({ hora_cierre_mediodia: '15:30:00' });
  });

  it('rechaza el mediodía después de la noche', async () => {
    const admin = await clienteComo('admin');
    const { error } = await admin
      .from('configuracion_de_caja')
      .update({ hora_cierre_mediodia: '23:00', hora_cierre_noche: '22:00' })
      .not('id', 'is', null);
    expect(error?.code).toBe('23514');
  });
});

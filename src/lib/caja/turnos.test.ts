import { describe, expect, it } from 'vitest';
import {
  cierreDelTurno,
  enlaceDelCierre,
  esquemaDeHoras,
  estadoDeFila,
  msHastaLaProximaConsulta,
  nombreDelTurno,
  textoDeAyerSinCierre,
  textoDeLaTraba,
  textoDePostergaciones,
  turnoDeLaVentaAMano,
  textoDePostergado,
  type EstadoDelTurno,
} from './turnos';

const libre: EstadoDelTurno = {
  fecha: '2026-11-19',
  turno: 1,
  trabado: false,
  motivo: null,
  fechaTrabada: null,
  turnoTrabado: null,
  postergadoHasta: null,
  proximaHora: '2026-11-19T19:00:00Z',
  horaDeCorte: '16:00',
};
const porHora: EstadoDelTurno = {
  ...libre,
  trabado: true,
  motivo: 'hora',
  fechaTrabada: '2026-11-19',
  turnoTrabado: 1,
  proximaHora: null,
};

describe('los nombres de los turnos', () => {
  it('dice el turno y su cierre', () => {
    expect([nombreDelTurno(1), nombreDelTurno(2)]).toEqual(['Mediodía', 'Noche']);
    expect([cierreDelTurno(1), cierreDelTurno(2)]).toEqual([
      'cierre del mediodía',
      'cierre de la noche',
    ]);
  });
});

describe('estadoDeFila', () => {
  it('pasa la fila de la base al estado, con la hora corta', () => {
    expect(
      estadoDeFila({
        fecha: '2026-11-19',
        turno: 2,
        trabado: false,
        motivo: null,
        fecha_trabada: null,
        turno_trabado: null,
        postergado_hasta: null,
        proxima_hora: '2026-11-20T02:00:00+00:00',
        hora_de_corte: '23:00:00',
      }),
    ).toMatchObject({ turno: 2, horaDeCorte: '23:00', proximaHora: '2026-11-20T02:00:00+00:00' });
  });
});

describe('textoDeLaTraba', () => {
  it('dice qué cierre falta según el motivo', () => {
    expect(textoDeLaTraba(porHora)).toBe('Pasaron las 16:00: es hora del cierre del mediodía.');
    expect(
      textoDeLaTraba({ ...porHora, motivo: 'ayer', fechaTrabada: '2026-11-18', turnoTrabado: 2 }),
    ).toBe('Quedó sin cargar el cierre de la noche de ayer.');
    expect(textoDeLaTraba({ ...porHora, motivo: 'cerrada', turnoTrabado: 2 })).toBe(
      'La caja de hoy ya cerró. Mañana se vuelve a vender.',
    );
  });
});

describe('textoDePostergado', () => {
  it('dice hasta qué hora, en Argentina', () => {
    const postergado = { ...porHora, trabado: false, postergadoHasta: '2026-11-19T19:20:00Z' };
    expect(textoDePostergado(postergado)).toBe('Cierre del mediodía postergado hasta las 16:20.');
  });

  it('sin postergación no dice nada', () => {
    expect(textoDePostergado(libre)).toBeNull();
  });
});

describe('msHastaLaProximaConsulta', () => {
  const ahora = new Date('2026-11-19T18:59:30Z');

  it('vuelve a preguntar a la hora de corte si llega antes del minuto', () => {
    expect(msHastaLaProximaConsulta(libre, ahora)).toBe(30_000);
  });

  it('o cuando vence la postergación', () => {
    const postergado = { ...porHora, postergadoHasta: '2026-11-19T18:59:40Z' };
    expect(msHastaLaProximaConsulta(postergado, ahora)).toBe(10_000);
  });

  it('y si no, cada minuto, nunca menos de un segundo', () => {
    expect(msHastaLaProximaConsulta(porHora, ahora)).toBe(60_000);
    const pasada = { ...libre, proximaHora: '2026-11-19T18:00:00Z' };
    expect(msHastaLaProximaConsulta(pasada, ahora)).toBe(1_000);
  });
});

describe('enlaceDelCierre', () => {
  it('lleva a cargar el cierre que falta', () => {
    expect(enlaceDelCierre(porHora)).toBe('/admin/caja?fecha=2026-11-19&turno=1');
  });
});

describe('esquemaDeHoras', () => {
  it('acepta HH:MM con el mediodía antes que la noche', () => {
    expect(esquemaDeHoras.safeParse({ mediodia: '16:00', noche: '23:30' }).success).toBe(true);
  });

  it.each([
    [{ mediodia: '16', noche: '23:00' }, 'Escribí la hora como 16:00.'],
    [{ mediodia: '24:00', noche: '23:00' }, 'Escribí la hora como 16:00.'],
    [{ mediodia: '23:00', noche: '22:00' }, 'El cierre del mediodía va antes que el de la noche.'],
  ])('rechaza %o', (datos, mensaje) => {
    const resultado = esquemaDeHoras.safeParse(datos);
    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues[0]?.message).toBe(mensaje);
  });
});

describe('textoDeAyerSinCierre', () => {
  it('nombra los turnos que faltan', () => {
    expect(textoDeAyerSinCierre([2])).toBe('Ayer quedó sin cargar el cierre de la noche.');
    expect(textoDeAyerSinCierre([1])).toBe('Ayer quedó sin cargar el cierre del mediodía.');
    expect(textoDeAyerSinCierre([2, 1])).toBe('Ayer quedó sin cargar el cierre de los dos turnos.');
    expect(textoDeAyerSinCierre([])).toBeNull();
  });
});

describe('textoDePostergaciones', () => {
  it('cuenta las veces y los minutos', () => {
    expect(textoDePostergaciones({ veces: 1, minutos: 10 })).toBe('Se postergó 1 vez (10 min).');
    expect(textoDePostergaciones({ veces: 3, minutos: 30 })).toBe('Se postergó 3 veces (30 min).');
    expect(textoDePostergaciones(null)).toBeNull();
  });
});

describe('turnoDeLaVentaAMano', () => {
  it('hoy, el turno abierto; un día anterior, la noche', () => {
    expect(turnoDeLaVentaAMano('2026-11-19', '2026-11-19', '1')).toBe('1');
    expect(turnoDeLaVentaAMano('2026-11-18', '2026-11-19', '1')).toBe('2');
  });
});

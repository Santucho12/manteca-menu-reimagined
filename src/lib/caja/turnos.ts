import { z } from 'zod';

/** 1 es el Mediodía y 2 la Noche. */
export type Turno = 1 | 2;
export type MotivoDeLaTraba = 'hora' | 'ayer' | 'cerrada';

/** Cómo está el mostrador: a qué turno va una venta y si está trabado por un cierre. */
export type EstadoDelTurno = {
  fecha: string;
  turno: Turno;
  trabado: boolean;
  motivo: MotivoDeLaTraba | null;
  fechaTrabada: string | null;
  turnoTrabado: Turno | null;
  postergadoHasta: string | null;
  proximaHora: string | null;
  /** La hora de cierre del turno, como HH:MM. */
  horaDeCorte: string;
};

/** Lo que devuelve caja_estado_del_mostrador. */
export type FilaDelEstado = {
  fecha: string;
  turno: number;
  trabado: boolean;
  motivo: string | null;
  fecha_trabada: string | null;
  turno_trabado: number | null;
  postergado_hasta: string | null;
  proxima_hora: string | null;
  hora_de_corte: string;
};

export const nombreDelTurno = (turno: Turno) => (turno === 1 ? 'Mediodía' : 'Noche');
export const cierreDelTurno = (turno: Turno) =>
  turno === 1 ? 'cierre del mediodía' : 'cierre de la noche';

export function estadoDeFila(fila: FilaDelEstado): EstadoDelTurno {
  return {
    fecha: fila.fecha,
    turno: fila.turno as Turno,
    trabado: fila.trabado,
    motivo: fila.motivo as MotivoDeLaTraba | null,
    fechaTrabada: fila.fecha_trabada,
    turnoTrabado: fila.turno_trabado as Turno | null,
    postergadoHasta: fila.postergado_hasta,
    proximaHora: fila.proxima_hora,
    horaDeCorte: fila.hora_de_corte.slice(0, 5),
  };
}

const HORA_ARGENTINA = new Intl.DateTimeFormat('es-AR', {
  timeZone: 'America/Argentina/Buenos_Aires',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function textoDeLaTraba(estado: EstadoDelTurno): string {
  const turno = estado.turnoTrabado ?? estado.turno;
  if (estado.motivo === 'cerrada') return 'La caja de hoy ya cerró. Mañana se vuelve a vender.';
  if (estado.motivo === 'ayer') return `Quedó sin cargar el ${cierreDelTurno(turno)} de ayer.`;
  return `Pasaron las ${estado.horaDeCorte}: es hora del ${cierreDelTurno(turno)}.`;
}

export function textoDePostergado(estado: EstadoDelTurno): string | null {
  if (!estado.postergadoHasta || !estado.turnoTrabado) return null;
  const hasta = HORA_ARGENTINA.format(new Date(estado.postergadoHasta));
  const cierre = cierreDelTurno(estado.turnoTrabado);
  return `${cierre[0]!.toUpperCase()}${cierre.slice(1)} postergado hasta las ${hasta}.`;
}

const UN_MINUTO = 60_000;
const UN_SEGUNDO = 1_000;

/** Cuándo volver a preguntar el estado: a la hora de corte, al vencer la postergación o al minuto. */
export function msHastaLaProximaConsulta(estado: EstadoDelTurno, ahora: Date): number {
  const momentos = [estado.proximaHora, estado.postergadoHasta]
    .filter((m): m is string => m !== null)
    .map((m) => Date.parse(m) - ahora.getTime());
  return Math.max(UN_SEGUNDO, Math.min(UN_MINUTO, ...momentos));
}

export const enlaceDelCierre = (estado: EstadoDelTurno) =>
  `/admin/caja?fecha=${estado.fechaTrabada ?? estado.fecha}&turno=${estado.turnoTrabado ?? estado.turno}`;

const HORA = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Escribí la hora como 16:00.');

export const esquemaDeHoras = z
  .object({ mediodia: HORA, noche: HORA })
  .refine((horas) => horas.mediodia < horas.noche, {
    message: 'El cierre del mediodía va antes que el de la noche.',
    path: ['mediodia'],
  });
export type HorasDeCierre = z.infer<typeof esquemaDeHoras>;

/** El aviso de Inicio para los turnos de ayer que quedaron sin cierre. */
export function textoDeAyerSinCierre(turnos: number[]): string | null {
  if (turnos.length === 0) return null;
  const cual =
    turnos.length > 1 ? 'de los dos turnos' : turnos[0] === 1 ? 'del mediodía' : 'de la noche';
  return `Ayer quedó sin cargar el cierre ${cual}.`;
}

/** En el detalle del cierre: cuántas veces se postergó y por cuánto en total. */
export function textoDePostergaciones(resumen: { veces: number; minutos: number } | null) {
  if (!resumen) return null;
  const veces = resumen.veces === 1 ? '1 vez' : `${resumen.veces} veces`;
  return `Se postergó ${veces} (${resumen.minutos} min).`;
}

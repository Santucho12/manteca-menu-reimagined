import { esFechaValida } from '../gastos/vencimientos';
import type { EstadoDelTurno, Turno } from './turnos';

type Pedido = { fecha?: string; turno?: string };

const turnoValido = (turno?: string): Turno | null =>
  turno === '1' ? 1 : turno === '2' ? 2 : null;

/**
 * Qué cierre abre Cargar cierre: el que pide la dirección si es válido; si no, el que traba el
 * mostrador o el turno abierto de hoy. Un día anterior sin turno pedido es el de la noche.
 */
export function cierreACargar(pedido: Pedido, hoy: string, estado: EstadoDelTurno) {
  const fecha =
    pedido.fecha && esFechaValida(pedido.fecha) && pedido.fecha <= hoy ? pedido.fecha : null;
  const turno = turnoValido(pedido.turno);
  if (fecha) return { fecha, turno: turno ?? (fecha === hoy ? estado.turno : 2) };
  if (estado.motivo === 'ayer' && estado.fechaTrabada && estado.turnoTrabado) {
    return { fecha: estado.fechaTrabada, turno: estado.turnoTrabado };
  }
  return { fecha: hoy, turno: turno ?? estado.turnoTrabado ?? estado.turno };
}

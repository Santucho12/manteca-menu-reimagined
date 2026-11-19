import type { Cliente } from '../supabase/cliente';
import type { ControlLeido } from './controles';
import type { HorasDeCierre, Turno } from './turnos';

function comprobar<T>(
  respuesta: { data: T | null; error: { message: string } | null },
  que: string,
) {
  if (respuesta.error) throw new Error(`No pudimos leer ${que}: ${respuesta.error.message}`);
  return respuesta.data as T;
}

export type TurnoPendiente = { fecha: string; turno: Turno };

/** Los turnos con ventas en la caja y sin cierre, ya pasada su hora; solo el admin. */
export async function turnosPendientes(
  cliente: Cliente,
  desde: string,
  hasta: string,
): Promise<TurnoPendiente[]> {
  const respuesta = await cliente.rpc('cierres_turnos_pendientes', { desde, hasta });
  return comprobar(respuesta, 'los turnos pendientes') as TurnoPendiente[];
}

/** Las horas de cierre de cada turno, como HH:MM. */
export async function horasDeCierreDelLocal(cliente: Cliente): Promise<HorasDeCierre> {
  const respuesta = await cliente
    .from('configuracion_de_caja')
    .select('hora_cierre_mediodia, hora_cierre_noche')
    .single();
  const fila = comprobar(respuesta, 'las horas de cierre');
  return {
    mediodia: fila.hora_cierre_mediodia.slice(0, 5),
    noche: fila.hora_cierre_noche.slice(0, 5),
  };
}

export type ResumenDePostergaciones = { veces: number; minutos: number; primera: string };

/** Cuántas veces se postergó el cierre de un turno y por cuánto; nulo si nunca. */
export async function postergacionesDelCierre(
  cliente: Cliente,
  fecha: string,
  turno: Turno,
): Promise<ResumenDePostergaciones | null> {
  const respuesta = await cliente
    .from('postergaciones_de_cierre')
    .select('desde, hasta')
    .eq('fecha', fecha)
    .eq('turno', turno)
    .order('desde');
  const filas = comprobar(respuesta, 'las postergaciones');
  if (filas.length === 0) return null;
  const ms = filas.reduce((suma, f) => suma + Date.parse(f.hasta) - Date.parse(f.desde), 0);
  return { veces: filas.length, minutos: Math.round(ms / 60_000), primera: filas[0]!.desde };
}

/** Lo anotado por tipo en los cierres del rango y lo cargado de cada tipo en su turno. */
export async function controlesDelRango(
  cliente: Cliente,
  desde: string,
  hasta: string,
): Promise<ControlLeido[]> {
  const respuesta = await cliente.rpc('cierres_controles', { desde, hasta });
  return comprobar(respuesta, 'los controles por tipo') as ControlLeido[];
}

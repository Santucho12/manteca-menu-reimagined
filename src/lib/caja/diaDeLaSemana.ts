const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

/** El día de la semana de una fecha AAAA-MM-DD, calculado en UTC para que no cambie con la zona. */
export function diaDeLaSemana(fecha: string): string {
  return DIAS[new Date(`${fecha}T12:00:00Z`).getUTCDay()] ?? '';
}

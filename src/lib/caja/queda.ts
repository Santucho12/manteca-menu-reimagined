import { formatearPesos } from '../plata';

/** Lo que se deja en la caja para mañana sale del efectivo contado: no puede ser más que eso. */
export function quedaDeMas(efectivoCentavos: number, quedaCentavos: number): boolean {
  return quedaCentavos > efectivoCentavos;
}

/** El aviso del detalle de un cierre que dejó más plata de la que se contó; null si está bien. */
export function avisoDeQueda(efectivoCentavos: number, quedaCentavos: number): string | null {
  if (!quedaDeMas(efectivoCentavos, quedaCentavos)) return null;
  const queda = formatearPesos(quedaCentavos);
  const contado = formatearPesos(efectivoCentavos);
  return `Quedan ${queda} en la caja pero se contaron ${contado} de efectivo: revisá el monto.`;
}

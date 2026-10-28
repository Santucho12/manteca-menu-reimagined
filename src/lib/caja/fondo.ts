import { fechaParaMostrar } from '../gastos/pantalla';
import { formatearPesos } from '../plata';
import { sumarDias } from '../reportes/periodos';

/**
 * Fondo de hoy menos lo que quedo en el cierre anterior; nulo si no hay anterior. Bajar el
 * fondo baja lo esperado y tapa un faltante: por eso se marca.
 */
export function diferenciaDeFondo(
  fondoInicialCentavos: number,
  fondoAnteriorCentavos: number | null,
): number | null {
  return fondoAnteriorCentavos === null ? null : fondoInicialCentavos - fondoAnteriorCentavos;
}

export function textoDeFondo(diferencia: number): string {
  const cuanto = formatearPesos(Math.abs(diferencia));
  const sentido = diferencia < 0 ? 'menos' : 'más';
  return `Arrancó con ${cuanto} ${sentido} de lo que quedó en el cierre anterior.`;
}

/**
 * Si el fondo precargado no viene del cierre de ayer, de qué día viene; nulo si viene de ayer
 * o no hay cierre anterior.
 */
export function avisoDelFondo(diaDelCierre: string | null, fecha: string): string | null {
  if (diaDelCierre === null || diaDelCierre === sumarDias(fecha, -1)) return null;
  return `Viene del cierre del ${fechaParaMostrar(diaDelCierre)}: el día anterior no tiene cierre cargado.`;
}

export const totalDeRetiros = (retiros: { monto_centavos: number }[]) =>
  retiros.reduce((suma, r) => suma + r.monto_centavos, 0);

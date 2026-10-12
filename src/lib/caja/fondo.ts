import { formatearPesos } from '../plata';

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

export const totalDeRetiros = (retiros: { monto_centavos: number }[]) =>
  retiros.reduce((suma, r) => suma + r.monto_centavos, 0);

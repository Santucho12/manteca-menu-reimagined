// Hasta seis cifras enteras y tres decimales con coma: 1,5 docenas o 0,250 kilos.
const FORMA = /^(\d{1,6})(?:,(\d{1,3}))?$/;

/** Lee una cantidad escrita a mano; undefined si no se entiende o es cero. */
export function cantidadDe(texto: string): number | undefined {
  const partes = FORMA.exec(texto.trim());
  if (!partes) return undefined;
  const milesimas = Number(partes[1]) * 1000 + Number((partes[2] ?? '').padEnd(3, '0'));
  return milesimas > 0 ? milesimas / 1000 : undefined;
}

/**
 * Cantidad por precio, redondeado a centavos como en la base. Se multiplica en milesimas de
 * unidad (enteros) para no arrastrar el error del punto flotante.
 */
export function subtotalDe(cantidad: number, precioCentavos: number): number {
  const milesimas = Math.round(cantidad * 1000);
  return Math.round((milesimas * precioCentavos) / 1000);
}

/** El total de la venta: la suma de los subtotales ya redondeados. */
export function totalDe(renglones: { cantidad: number; precioCentavos: number }[]): number {
  return renglones.reduce((suma, r) => suma + subtotalDe(r.cantidad, r.precioCentavos), 0);
}

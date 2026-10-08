export const REDONDEOS_CENTAVOS = [1000, 5000, 10000, 50000] as const;
export type RedondeoCentavos = (typeof REDONDEOS_CENTAVOS)[number];
export const REDONDEO_POR_DEFECTO: RedondeoCentavos = 10000;
export const PORCENTAJE_MINIMO = -50;
export const PORCENTAJE_MAXIMO = 200;

export type PrecioDelAlcance = {
  id: string;
  categoria: string;
  // null: el precio compartido de la categoria.
  producto: string | null;
  presentacion: string;
  montoCentavos: number;
  oculto: boolean;
};
export type CambioDePrecio = PrecioDelAlcance & { nuevoCentavos: number };

/**
 * El precio con el porcentaje aplicado, redondeado al paso mas cercano (la mitad, para
 * arriba). Nunca baja de un paso: un descuento no deja un precio en cero. En BigInt para no
 * pasar por punto flotante.
 */
export function precioAumentado(
  montoCentavos: number,
  porcentaje: number,
  redondeoCentavos: RedondeoCentavos,
): number {
  const numerador = BigInt(montoCentavos) * BigInt(100 + porcentaje);
  const divisor = BigInt(100 * redondeoCentavos);
  const pasos = numerador / divisor + ((numerador % divisor) * 2n >= divisor ? 1n : 0n);
  return Number(pasos < 1n ? 1n : pasos) * redondeoCentavos;
}

export function vistaPrevia(
  precios: PrecioDelAlcance[],
  porcentaje: number,
  redondeoCentavos: RedondeoCentavos,
): CambioDePrecio[] {
  return precios.map((precio) => ({
    ...precio,
    nuevoCentavos: precioAumentado(precio.montoCentavos, porcentaje, redondeoCentavos),
  }));
}

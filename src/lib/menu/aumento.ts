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

// Al paso mas cercano, la mitad para arriba. En BigInt para no pasar por punto flotante.
function redondeado(montoCentavos: number, porcentaje: number, redondeo: number): number {
  const numerador = BigInt(montoCentavos) * BigInt(100 + porcentaje);
  const divisor = BigInt(100 * redondeo);
  const pasos = numerador / divisor + ((numerador % divisor) * 2n >= divisor ? 1n : 0n);
  return Number(pasos) * redondeo;
}

/**
 * El precio con el porcentaje aplicado y redondeado. Si el redondeo lo deja en cero o lo
 * mueve en contra del porcentaje (un descuento que encarece, un aumento que abarata), el
 * precio queda como estaba: la vista previa lo muestra sin cambio.
 */
export function precioAumentado(
  montoCentavos: number,
  porcentaje: number,
  redondeoCentavos: RedondeoCentavos,
): number {
  const nuevo = redondeado(montoCentavos, porcentaje, redondeoCentavos);
  const contrario = porcentaje < 0 ? nuevo > montoCentavos : nuevo < montoCentavos;
  return nuevo === 0 || contrario ? montoCentavos : nuevo;
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

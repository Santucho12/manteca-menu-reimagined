export type Azar = () => number;

/**
 * Números al azar que se repiten con la misma semilla (mulberry32): los datos de ejemplo salen
 * iguales cada vez que se arman, y un test los puede mirar.
 */
export function crearAzar(semilla: number): Azar {
  let estado = semilla >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Un entero entre los dos extremos, incluidos. */
export const entero = (azar: Azar, desde: number, hasta: number) =>
  desde + Math.floor(azar() * (hasta - desde + 1));

/** Una opción, con más chance cuanto más pesa. */
export function elegir<T>(azar: Azar, opciones: readonly { valor: T; peso: number }[]): T {
  let tirada = azar() * opciones.reduce((suma, o) => suma + o.peso, 0);
  for (const opcion of opciones) {
    tirada -= opcion.peso;
    if (tirada < 0) return opcion.valor;
  }
  return opciones[opciones.length - 1]!.valor;
}

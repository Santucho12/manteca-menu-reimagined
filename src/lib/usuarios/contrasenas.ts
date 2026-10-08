// Sin caracteres que se confundan al dictarlos: ni 0, O ni o; ni 1, I ni l.
export const ALFABETO_TEMPORAL = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
export const LARGO_TEMPORAL = 12;

/** Una contraseña temporal armada con el azar que recibe: un entero de 32 bits por caracter. */
export function contrasenaTemporal(azar: Uint32Array): string {
  if (azar.length < LARGO_TEMPORAL) {
    throw new Error(`Hacen falta ${LARGO_TEMPORAL} valores al azar.`);
  }
  return Array.from(azar.subarray(0, LARGO_TEMPORAL), (valor) =>
    ALFABETO_TEMPORAL.charAt(valor % ALFABETO_TEMPORAL.length),
  ).join('');
}

/** Una contraseña temporal nueva, con el azar criptografico del sistema. */
export function crearContrasenaTemporal(): string {
  return contrasenaTemporal(crypto.getRandomValues(new Uint32Array(LARGO_TEMPORAL)));
}

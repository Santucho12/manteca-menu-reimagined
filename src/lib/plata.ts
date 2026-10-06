/** Muestra un monto en centavos enteros como $1.234,50. */
export function formatearPesos(centavos: number): string {
  if (!Number.isInteger(centavos)) {
    throw new Error(`Un monto tiene que ser un entero de centavos y llegó: ${centavos}`);
  }
  const signo = centavos < 0 ? '-' : '';
  const absoluto = Math.abs(centavos);
  // Se separa con enteros para no pasar nunca por punto flotante.
  const pesos = String(Math.trunc(absoluto / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const resto = String(absoluto % 100).padStart(2, '0');
  return `${signo}$${pesos},${resto}`;
}

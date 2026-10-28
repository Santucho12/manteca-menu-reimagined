/** Muestra un monto en centavos enteros como $1.234,50. */
export function formatearPesos(centavos: number): string {
  // isSafeInteger y no isInteger: pasado 2^53 los enteros ya perdieron precision.
  if (!Number.isSafeInteger(centavos)) {
    throw new Error(`Un monto tiene que ser un entero de centavos y llegó: ${centavos}`);
  }
  const signo = centavos < 0 ? '-' : '';
  const absoluto = Math.abs(centavos);
  // Se separa con enteros para no pasar nunca por punto flotante.
  const pesos = String(Math.trunc(absoluto / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const resto = String(absoluto % 100).padStart(2, '0');
  return `${signo}$${pesos},${resto}`;
}

/** Un monto redondeado al peso, para los numeros grandes de Inicio: $14.542.500. */
export function formatearPesosRedondeados(centavos: number): string {
  // Se redondea el valor absoluto: asi -$0,50 y $0,50 redondean igual, hacia afuera.
  const pesos = Math.trunc((Math.abs(centavos) + 50) / 100);
  const signo = centavos < 0 && pesos > 0 ? '-' : '';
  return `${signo}${formatearPesosEnteros(pesos * 100)}`;
}

/** Un monto en pesos enteros como lo ve el publico del menu: $4.000. */
export function formatearPesosEnteros(centavos: number): string {
  if (!Number.isSafeInteger(centavos) || centavos % 100 !== 0) {
    throw new Error(`Un precio del menu tiene que ser de pesos enteros y llegó: ${centavos}`);
  }
  const pesos = String(Math.abs(centavos) / 100).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${centavos < 0 ? '-' : ''}$${pesos}`;
}

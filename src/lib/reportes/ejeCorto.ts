const coma = (numero: number) => String(numero).replace('.', ',');

/** Un monto para el eje de un grafico, corto: $20 M, $2,5 M, $500 k, $450. */
export function pesosCortos(centavos: number): string {
  const signo = centavos < 0 ? '-' : '';
  const pesos = Math.round(Math.abs(centavos) / 100);
  // Un decimal como mucho: el eje orienta, el monto exacto esta en la ventanita.
  if (pesos >= 1_000_000) return `${signo}$${coma(Math.round(pesos / 100_000) / 10)} M`;
  if (pesos >= 1_000) return `${signo}$${coma(Math.round(pesos / 100) / 10)} k`;
  return `${signo}$${pesos}`;
}

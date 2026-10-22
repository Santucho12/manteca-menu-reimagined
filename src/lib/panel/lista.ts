/** "20 Resultados", como el contador de la tabla de Plan Reminder Pro (las mayusculas las pone el CSS). */
export function cantidadDeResultados(total: number): string {
  return total === 1 ? '1 Resultado' : `${total} Resultados`;
}

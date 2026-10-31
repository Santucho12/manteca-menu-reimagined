/**
 * Lo que muestra Gastos al abrir. Las listas se leen junto con el acceso, antes de generar lo
 * vencido: si se genero algo, se vuelven a leer para que aparezca en esta misma apertura. Lo
 * comun es que no haga falta, porque pg_cron genera a la madrugada.
 */
export function listasAlDia<T>(generados: number, leidas: T, releer: () => Promise<T>): Promise<T> {
  return generados > 0 ? releer() : Promise.resolve(leidas);
}

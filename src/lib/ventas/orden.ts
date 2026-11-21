/** La lista con el elemento de `desde` corrido un lugar arriba (-1) o abajo (1); en la punta, igual. */
export function moverEnLista<T>(lista: T[], desde: number, paso: -1 | 1): T[] {
  const hasta = desde + paso;
  if (hasta < 0 || hasta >= lista.length) return lista;
  const nueva = [...lista];
  [nueva[desde], nueva[hasta]] = [nueva[hasta]!, nueva[desde]!];
  return nueva;
}

export type DiaQueNoAbrio = { noAbrio: true; fecha: string };

/**
 * Los cierres de la página con los días que el local no abrió en su lugar, de la fecha más nueva
 * a la más vieja (Santiago, 2026-11-20). Con varias páginas, cada día va en la de su fecha: la
 * primera suma los más nuevos y la última los más viejos.
 */
export function filasConNoAbrio<T extends { fecha: string }>(
  cierres: T[],
  dias: string[],
  primera: boolean,
  ultima: boolean,
): (T | DiaQueNoAbrio)[] {
  const fechas = cierres.map((c) => c.fecha);
  const nueva = fechas.reduce((a, b) => (a > b ? a : b), '');
  const vieja = fechas.reduce((a, b) => (a < b ? a : b), '9999');
  const entra = (d: string) =>
    cierres.length === 0 || ((primera || d <= nueva) && (ultima || d >= vieja));
  const noAbrio = dias.filter(entra).map((fecha): DiaQueNoAbrio => ({ noAbrio: true, fecha }));
  return [...cierres, ...noAbrio].sort((a, b) => b.fecha.localeCompare(a.fecha));
}

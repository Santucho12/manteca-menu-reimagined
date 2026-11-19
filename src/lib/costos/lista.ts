import type { FilaDeCosto } from './calculo';

export type FiltroDeCostos = 'todos' | 'debajo' | 'sin_receta';
export type OrdenDeCostos = 'porcentaje' | 'nombre';
export type FiltrosDeCostos = { filtro: FiltroDeCostos; orden: OrdenDeCostos };

type ConPresentaciones = { producto: string; presentaciones: FilaDeCosto[] };

/** El peor porcentaje del producto: el ranking empieza por el que menos deja. */
function peorPorcentaje(fila: ConPresentaciones): number | null {
  const porcentajes = fila.presentaciones
    .map((p) => p.porcentaje)
    .filter((p): p is number => p !== null);
  return porcentajes.length === 0 ? null : Math.min(...porcentajes);
}

/** De menor a mayor porcentaje; los que no tienen numero van al final, por nombre. */
export function porPorcentaje(a: ConPresentaciones, b: ConPresentaciones): number {
  const [pa, pb] = [peorPorcentaje(a), peorPorcentaje(b)];
  if (pa === null && pb === null) return a.producto.localeCompare(b.producto, 'es');
  if (pa === null) return 1;
  if (pb === null) return -1;
  return pa - pb;
}

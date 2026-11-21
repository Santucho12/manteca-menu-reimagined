import type { Aviso } from './avisos';

/** La tarjeta tiene alto fijo: entran 4 avisos; el resto se ve en "Ver todos". */
export const AVISOS_EN_LA_TARJETA = 4;

export function avisosALaVista(avisos: Aviso[]) {
  return {
    visibles: avisos.slice(0, AVISOS_EN_LA_TARJETA),
    ocultos: Math.max(0, avisos.length - AVISOS_EN_LA_TARJETA),
  };
}

/** Los avisos descartados con la X: valen solo el día en que se descartaron. */
// restas: lo que cada sección del menú lateral descuenta de su número por lo eliminado.
export type Descartados = { dia: string; textos: string[]; restas?: Record<string, number> };

export function sinDescartados(avisos: Aviso[], descartados: Descartados | null, hoy: string) {
  if (!descartados || descartados.dia !== hoy) return avisos;
  return avisos.filter((a) => !descartados.textos.includes(a.texto));
}

/** El número de una sección del menú lateral, menos lo de los avisos eliminados hoy. */
export function insigniaSinDescartados(
  numero: number | null,
  clave: string,
  descartados: Descartados | null,
  hoy: string,
): number | null {
  const resta = descartados?.dia === hoy ? (descartados.restas?.[clave] ?? 0) : 0;
  const queda = (numero ?? 0) - resta;
  return queda > 0 ? queda : null;
}

/** Los descartados de hoy con un aviso más, y su número restado de su sección. */
export function conUnDescartado(
  previos: Descartados | null,
  aviso: Aviso,
  hoy: string,
): Descartados {
  const deHoy = previos?.dia === hoy ? previos : { dia: hoy, textos: [], restas: {} };
  const restas = { ...deHoy.restas };
  if (aviso.seccion) restas[aviso.seccion] = (restas[aviso.seccion] ?? 0) + (aviso.cantidad ?? 0);
  return { dia: hoy, textos: [...deHoy.textos, aviso.texto], restas };
}

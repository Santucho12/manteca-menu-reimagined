import type { Medio } from '../caja/resultado';

/** Las clases de un color: el fondo suave, el texto, el borde y el lleno. */
export type Tono = { suave: string; texto: string; borde: string; solido: string };

const tono = (c: string): Tono => ({
  suave: `bg-${c}-50`,
  texto: `text-${c}-700`,
  borde: `border-${c}-300`,
  solido: `bg-${c}-500`,
});

// Escritas enteras para que Tailwind las encuentre: ver la lista de abajo.
// Vender conserva sus colores (Santiago, 2026-11-21); las listas usan la regla de coloresDelSistema.
const RONDA: Tono[] = ['emerald', 'rose', 'amber', 'blue', 'teal', 'orange'].map(tono);

/** El color de una categoría o un tipo de venta, por su lugar en la lista. */
export const tonoEnLista = (indice: number): Tono => RONDA[indice % RONDA.length]!;

// Otro no es un lugar de venta en especial: va en gris, para no competir con los demás.
const GRIS: Tono = {
  suave: 'bg-slate-100',
  texto: 'text-slate-700',
  borde: 'border-slate-300',
  solido: 'bg-slate-400',
};

/** El color de un tipo de venta: Otro en gris; los demás, por su lugar en Tipos de venta. */
export const tonoDelTipo = (nombre: string, indice: number): Tono =>
  nombre.trim().toLowerCase() === 'otro' ? GRIS : tonoEnLista(indice);

const MEDIOS: Record<Medio, Tono> = {
  efectivo: tono('emerald'),
  debito: tono('blue'),
  credito: tono('violet'),
  qr: tono('amber'),
  transferencia: tono('teal'),
};

/** Cada medio de pago, siempre con el mismo color. */
export const tonoDeMedio = (medio: Medio): Tono => MEDIOS[medio];

/*
 * Tailwind solo genera las clases que lee escritas enteras:
 * bg-emerald-50 text-emerald-700 border-emerald-300 bg-emerald-500
 * bg-rose-50 text-rose-700 border-rose-300 bg-rose-500
 * bg-amber-50 text-amber-700 border-amber-300 bg-amber-500
 * bg-blue-50 text-blue-700 border-blue-300 bg-blue-500
 * bg-teal-50 text-teal-700 border-teal-300 bg-teal-500
 * bg-orange-50 text-orange-700 border-orange-300 bg-orange-500
 * bg-violet-50 text-violet-700 border-violet-300 bg-violet-500
 */

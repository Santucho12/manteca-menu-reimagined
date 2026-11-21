/**
 * La regla de color del sistema (Santiago, 2026-11-21): verde es que está bien, rojo que está mal o
 * es una alerta, gris que está desactivado, cerrado o no cuenta. Lo que solo hay que distinguir
 * (personas, tipos, medios) va en violeta, rojo o naranja (Santiago, 2026-11-21). El amarillo, solo
 * para el Mediodía; el ámbar no se usa. Las clases van enteras para que Tailwind las encuentre.
 */
const BIEN = 'bg-emerald-50 text-emerald-700 border-emerald-200';
const MAL = 'bg-rose-50 text-rose-700 border-rose-200';
const APAGADO = 'bg-slate-100 text-slate-600 border-slate-200';
const VIOLETA = 'bg-violet-50 text-violet-700 border-violet-200';
const ROJO = 'bg-rose-50 text-rose-700 border-rose-200';
const NARANJA = 'bg-orange-50 text-orange-700 border-orange-200';

const DISTINTOS = [VIOLETA, ROJO, NARANJA];

const ACCIONES: Record<string, string> = {
  alta: BIEN,
  reactivacion: BIEN,
  anulacion: MAL,
  desactivacion: APAGADO,
};

export const colorDeAccion = (accion: string): string => ACCIONES[accion] ?? VIOLETA;

/** Siempre el mismo color para el mismo nombre. */
export function colorDePersona(nombre: string): string {
  const suma = [...nombre].reduce((total, letra) => total + letra.charCodeAt(0), 0);
  return DISTINTOS[suma % DISTINTOS.length]!;
}

// El mediodía en amarillo, como el sol (Santiago, 2026-11-21); la noche en violeta.
const AMARILLO = 'bg-yellow-50 text-yellow-700 border-yellow-300';
export const colorDeTurno = (turno: number): string => (turno === 1 ? AMARILLO : VIOLETA);

/** El tipo de venta por su lugar en Tipos de venta; Otro y los que ya no están, en gris. */
export function colorDelTipo(nombre: string, tipos: string[]): string {
  const indice = tipos.indexOf(nombre);
  if (indice < 0 || nombre.trim().toLowerCase() === 'otro') return APAGADO;
  return DISTINTOS[indice % DISTINTOS.length]!;
}

const MEDIOS: Record<string, string> = {
  efectivo: VIOLETA,
  debito: NARANJA,
  credito: ROJO,
  qr: VIOLETA,
  transferencia: NARANJA,
};

/** Cada medio de pago en las listas; el ícono termina de distinguirlos. */
export const colorDelMedio = (medio: string): string => MEDIOS[medio] ?? APAGADO;

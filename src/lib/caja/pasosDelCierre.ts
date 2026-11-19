import type { FieldPath } from 'react-hook-form';
import type { DatosDeCierre } from './esquemas';

/** El cierre se carga por pasos: la caja, una ventana por tipo de venta y el comentario. */
export type PasoDelCierre =
  { tipo: 'caja' } | { tipo: 'control'; indice: number } | { tipo: 'comentario' };

export function pasosDelCierre(cantidadDeTipos: number): PasoDelCierre[] {
  const controles = Array.from({ length: cantidadDeTipos }, (_, indice) => ({
    tipo: 'control' as const,
    indice,
  }));
  return [{ tipo: 'caja' }, ...controles, { tipo: 'comentario' }];
}

const CAMPOS_DE_LA_CAJA: FieldPath<DatosDeCierre>[] = [
  'fecha',
  'turno',
  'fondoInicial',
  'efectivo',
  'credito',
  'debito',
  'qr',
  'transferencia',
  'quedaEnCaja',
  'retiros',
  'gastos',
];

// Antes de avanzar se valida solo lo del paso: un tipo sin cargar no frena la caja.
export function camposDelPaso(paso: PasoDelCierre): FieldPath<DatosDeCierre>[] {
  if (paso.tipo === 'caja') return CAMPOS_DE_LA_CAJA;
  if (paso.tipo === 'comentario') return ['comentario'];
  return [`controles.${paso.indice}.total`, `controles.${paso.indice}.cantidad`];
}

export function pasoSiguiente(actual: number, direccion: 1 | -1, cantidad: number): number {
  return Math.min(Math.max(actual + direccion, 0), cantidad - 1);
}

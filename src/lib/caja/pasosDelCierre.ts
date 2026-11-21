import type { FieldPath } from 'react-hook-form';
import type { DatosDeCierre } from './esquemas';

/**
 * El cierre se carga en dos pasos: la caja y después, en una sola ventana, lo facturado en cada
 * tipo de venta y el comentario (Santiago, 2026-11-20).
 */
export type PasoDelCierre = { tipo: 'caja' } | { tipo: 'final' };

export function pasosDelCierre(): PasoDelCierre[] {
  return [{ tipo: 'caja' }, { tipo: 'final' }];
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
export function camposDelPaso(
  paso: PasoDelCierre,
  cantidadDeTipos: number,
): FieldPath<DatosDeCierre>[] {
  if (paso.tipo === 'caja') return CAMPOS_DE_LA_CAJA;
  const totales = Array.from(
    { length: cantidadDeTipos },
    (_, indice) => `controles.${indice}.total` as const,
  );
  return [...totales, 'comentario'];
}

export function pasoSiguiente(actual: number, direccion: 1 | -1, cantidad: number): number {
  return Math.min(Math.max(actual + direccion, 0), cantidad - 1);
}

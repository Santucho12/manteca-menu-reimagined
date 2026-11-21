import { centavosDeCaja } from '../caja/esquemas';

export type Vuelto = { vueltoCentavos: number } | { faltaCentavos: number } | null;

/** Lo que hay que devolver con lo que pagaron, o cuánto falta; null mientras no hay un monto. */
export function vueltoParaMostrar(efectivoCentavos: number, pagaronEscrito: string): Vuelto {
  if (pagaronEscrito.trim() === '') return null;
  const pagaron = centavosDeCaja(pagaronEscrito);
  if (pagaron === undefined) return null;
  const diferencia = pagaron - efectivoCentavos;
  return diferencia >= 0 ? { vueltoCentavos: diferencia } : { faltaCentavos: -diferencia };
}

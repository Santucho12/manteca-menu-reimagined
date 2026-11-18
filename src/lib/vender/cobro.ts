import { centavosDeCaja } from '../caja/esquemas';
import type { Medio } from '../caja/resultado';
import type { Cobro } from './pagos';

/** Lo que eligió quien cobra en la pantalla, todavía sin validar. */
export type EleccionDeCobro = {
  medio: Medio | null;
  dosMedios: boolean;
  segundoMedio: Medio | null;
  /** Lo que va con el primer medio, como se escribió: "5.000". */
  primeroEscrito: string;
};

/** El cobro elegido, o null mientras falte elegir un medio o escribir cuánto va en el primero. */
export function cobroElegido(eleccion: EleccionDeCobro): Cobro | null {
  const { medio, segundoMedio } = eleccion;
  if (!medio) return null;
  if (!eleccion.dosMedios) return { medio };
  // Vacío es que todavía no se escribió, no $0 como en la caja.
  const escrito = eleccion.primeroEscrito.trim();
  const monto = escrito === '' ? undefined : centavosDeCaja(escrito);
  if (!segundoMedio || monto === undefined) return null;
  return { medio, segundoMedio, montoDelPrimeroCentavos: monto };
}

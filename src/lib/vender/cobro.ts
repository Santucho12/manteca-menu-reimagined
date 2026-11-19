import { centavosDeCaja } from '../caja/esquemas';
import type { Medio } from '../caja/resultado';
import { formatearPesos } from '../plata';
import { pagosDelCobro, vueltoDe, type Cobro, type PagoDelMostrador } from './pagos';

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

/** Lo que muestra la pantalla al cobrar: los pagos listos, por qué no, y el vuelto. */
export type EstadoDelCobro = {
  pagos: PagoDelMostrador[] | null;
  aviso: string | null;
  vuelto: string | null;
};

function textoDelVuelto(pagos: PagoDelMostrador[], pagaConEscrito: string): string | null {
  const pagaCon = pagaConEscrito.trim() === '' ? undefined : centavosDeCaja(pagaConEscrito);
  if (pagaCon === undefined || !pagos.some((p) => p.medio === 'efectivo')) return null;
  const vuelto = vueltoDe(pagos, pagaCon);
  return vuelto.ok ? `Vuelto: ${formatearPesos(vuelto.datos)}` : vuelto.mensaje;
}

export function estadoDelCobro(
  totalCentavos: number,
  eleccion: EleccionDeCobro,
  pagaConEscrito: string,
): EstadoDelCobro {
  const cobro = cobroElegido(eleccion);
  if (!cobro) return { pagos: null, aviso: null, vuelto: null };
  const pagos = pagosDelCobro(totalCentavos, cobro);
  if (!pagos.ok) return { pagos: null, aviso: pagos.mensaje, vuelto: null };
  return { pagos: pagos.datos, aviso: null, vuelto: textoDelVuelto(pagos.datos, pagaConEscrito) };
}

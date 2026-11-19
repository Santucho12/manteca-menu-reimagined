import type { MedioDeVenta as Medio } from '../caja/resultado';
import { formatearPesos } from '../plata';
import { exito, fallo, type Resultado } from '../resultado';

export type PagoDelMostrador = { medio: Medio; montoCentavos: number };

/** Lo que elige quien cobra: un medio, o dos con lo que va en el primero. */
export type Cobro =
  { medio: Medio } | { medio: Medio; segundoMedio: Medio; montoDelPrimeroCentavos: number };

/** Los pagos de la venta: uno con el total, o dos que lo suman. */
export function pagosDelCobro(totalCentavos: number, cobro: Cobro): Resultado<PagoDelMostrador[]> {
  if (totalCentavos <= 0) return fallo('Sumá al menos un producto.');
  if (!('segundoMedio' in cobro))
    return exito([{ medio: cobro.medio, montoCentavos: totalCentavos }]);
  if (cobro.segundoMedio === cobro.medio) return fallo('Elegí dos medios distintos.');
  const primero = cobro.montoDelPrimeroCentavos;
  if (primero <= 0 || primero >= totalCentavos) {
    return fallo(
      `Con el primer medio va una parte: más de $0 y menos de ${formatearPesos(totalCentavos)}.`,
    );
  }
  return exito([
    { medio: cobro.medio, montoCentavos: primero },
    { medio: cobro.segundoMedio, montoCentavos: totalCentavos - primero },
  ]);
}

/** Lo que se le devuelve al cliente: lo que paga menos la parte en efectivo. */
export function vueltoDe(pagos: PagoDelMostrador[], pagaConCentavos: number): Resultado<number> {
  const enEfectivo = pagos
    .filter((p) => p.medio === 'efectivo')
    .reduce((suma, p) => suma + p.montoCentavos, 0);
  if (pagaConCentavos < enEfectivo) {
    return fallo(`Con eso no alcanza: faltan ${formatearPesos(enEfectivo - pagaConCentavos)}.`);
  }
  return exito(pagaConCentavos - enEfectivo);
}

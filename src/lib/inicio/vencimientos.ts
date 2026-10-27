import type { FilaDeRecurrente } from '../gastos/consultas';
import { proximoVencimiento } from '../gastos/vencimientos';
import { sumarDias } from '../reportes/periodos';

export type Vencimiento = {
  id: string;
  fecha: string;
  descripcion: string;
  proveedor: string | null;
  montoCentavos: number;
};
export type VencimientosDeLaSemana = { items: Vencimiento[]; totalCentavos: number };

const aVencimiento = (r: FilaDeRecurrente, fecha: string): Vencimiento => ({
  id: r.id,
  fecha,
  descripcion: r.descripcion ?? r.categoria,
  proveedor: r.proveedor,
  montoCentavos: r.monto_centavos,
});

/** Los recurrentes activos que vencen de hoy a 6 dias, con el mismo calculo que la base. */
export function vencimientosDeLaSemana(
  recurrentes: FilaDeRecurrente[],
  hoy: string,
): VencimientosDeLaSemana {
  const hasta = sumarDias(hoy, 6);
  const items = recurrentes
    .filter((r) => r.activo)
    .map((r) => aVencimiento(r, proximoVencimiento(r.primer_vencimiento, r.frecuencia, hoy)))
    .filter((v) => v.fecha <= hasta)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  const totalCentavos = items.reduce((suma, v) => suma + v.montoCentavos, 0);
  return { items, totalCentavos };
}

import type { FilaDeCierre } from '../caja/consultas';
import { formatearPesos } from '../plata';
import { sumarDias } from '../reportes/periodos';
import { totalesDeVentas, type VentaDelDia } from '../reportes/ventas';
import type { DatosDeAvisos } from './avisos';

export type CierreDeAyer =
  | { estado: 'sin_cargar' }
  | { estado: 'cargado' }
  | { estado: 'con_diferencia'; diferenciaCentavos: number; enlace: string };

export type ResumenDeAyer = {
  dia: string;
  ventas: number;
  montoCentavos: number;
  ticketCentavos: number | null;
  cierre: CierreDeAyer;
};

function cierreDeAyer(cierres: FilaDeCierre[], ayer: string): CierreDeAyer {
  const vigente = cierres.find((c) => c.fecha === ayer && !c.anulado);
  if (!vigente) return { estado: 'sin_cargar' };
  if (vigente.estado !== 'con_diferencia') return { estado: 'cargado' };
  return {
    estado: 'con_diferencia',
    diferenciaCentavos: vigente.diferenciaTotalCentavos,
    enlace: `/admin/caja/control?desde=${ayer}&hasta=${ayer}`,
  };
}

/** Ventas, tickets y cierre de ayer, el dia en Argentina anterior a hoy. */
export function resumenDeAyer(
  ventas: VentaDelDia[],
  cierres: FilaDeCierre[],
  hoy: string,
): ResumenDeAyer {
  const dia = sumarDias(hoy, -1);
  const totales = totalesDeVentas(ventas.filter((v) => v.dia === dia));
  return {
    dia,
    ventas: totales.ventas,
    montoCentavos: totales.montoCentavos,
    ticketCentavos: totales.ticketCentavos,
    cierre: cierreDeAyer(cierres, dia),
  };
}

export function textoDelCierre(cierre: CierreDeAyer): string {
  if (cierre.estado === 'cargado') return 'Cierre cargado';
  if (cierre.estado === 'sin_cargar') return 'Cierre sin cargar';
  return `Cierre con diferencia de ${formatearPesos(cierre.diferenciaCentavos)}`;
}

// Un dia sin ventas es un dia que el local no abrio: no hay cierre que reclamar.
export const sinAvisoSiAyerNoHuboVentas = (
  datos: DatosDeAvisos,
  ventasDeAyer: number,
): DatosDeAvisos => (ventasDeAyer === 0 ? { ...datos, ayerSinCierre: null } : datos);

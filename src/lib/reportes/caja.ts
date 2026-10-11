import { fechaParaMostrar } from '../gastos/pantalla';
import { diasSinCierre } from '../caja/dias';
import { formatearPesos } from '../plata';
import { sumarDias, type Periodo } from './periodos';

export type CierreDelReporte = {
  fecha: string;
  persona: string;
  declaradoCentavos: number;
  diferenciaCentavos: number | null;
};
export type FilaDeCaja = { fecha: string; cierre: CierreDelReporte | null };
export type ResumenDeEmpleado = {
  persona: string;
  cierres: number;
  diferenciaCentavos: number | null;
};

/** Los cierres y los dias sin cierre, del mas nuevo al mas viejo. Hoy todavia no cuenta. */
export function filasDeCaja(
  cierres: CierreDelReporte[],
  periodo: Periodo,
  primero: string | null,
  hoy: string,
): FilaDeCaja[] {
  const faltan = diasSinCierre({
    ...periodo,
    conCierre: cierres.map((c) => c.fecha),
    primero,
    hoy: sumarDias(hoy, -1),
  });
  return [
    ...cierres.map((cierre) => ({ fecha: cierre.fecha, cierre })),
    ...faltan.map((fecha) => ({ fecha, cierre: null })),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha));
}

function sumarDiferencia(previa: number | null, nueva: number | null): number | null {
  if (nueva === null) return previa;
  return (previa ?? 0) + nueva;
}

/** Cuantos cierres cargo cada persona y la suma de las diferencias que ya se conocen. */
export function resumenPorEmpleado(cierres: CierreDelReporte[]): ResumenDeEmpleado[] {
  const personas = new Map<string, ResumenDeEmpleado>();
  for (const c of cierres) {
    const previo = personas.get(c.persona) ?? {
      persona: c.persona,
      cierres: 0,
      diferenciaCentavos: null,
    };
    personas.set(c.persona, {
      persona: c.persona,
      cierres: previo.cierres + 1,
      diferenciaCentavos: sumarDiferencia(previo.diferenciaCentavos, c.diferenciaCentavos),
    });
  }
  return [...personas.values()].sort((a, b) => a.persona.localeCompare(b.persona));
}

export const textoDeDiferencia = (diferencia: number | null) =>
  diferencia === null ? 'Esperando ventas' : formatearPesos(diferencia);

/** Los cierres que ya tienen diferencia, del mas viejo al mas nuevo, para el grafico. */
export const diferenciasDelGrafico = (cierres: CierreDelReporte[]) =>
  cierres
    .filter((c) => c.diferenciaCentavos !== null)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((c) => ({ nombre: fechaParaMostrar(c.fecha), montoCentavos: c.diferenciaCentavos! }));

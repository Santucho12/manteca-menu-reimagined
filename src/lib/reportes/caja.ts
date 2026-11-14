import { fechaParaMostrar } from '../gastos/pantalla';
import { diasQueNoAbrio, diasSinCierre } from '../caja/dias';
import { sumarDias, type Periodo } from './periodos';

export type CierreDelReporte = {
  fecha: string;
  persona: string;
  declaradoCentavos: number;
  diferenciaCentavos: number | null;
};
export type FilaDeCaja = { fecha: string; cierre: CierreDelReporte | null; noAbrio: boolean };
export type ResumenDeEmpleado = {
  persona: string;
  cierres: number;
  diferenciaCentavos: number | null;
};

const sinCierre = (fecha: string, noAbrio: boolean): FilaDeCaja => ({
  fecha,
  cierre: null,
  noAbrio,
});

/** Los cierres, los dias sin cierre y los que el local no abrio, del mas nuevo al mas viejo. */
export function filasDeCaja(
  cierres: CierreDelReporte[],
  periodo: Periodo,
  primero: string | null,
  hoy: string,
  sinAbrir: string[] = [],
): FilaDeCaja[] {
  const conCierre = cierres.map((c) => c.fecha);
  // Hoy todavia no cuenta como dia sin cierre.
  const ayer = sumarDias(hoy, -1);
  const faltan = diasSinCierre({ ...periodo, conCierre, sinAbrir, primero, hoy: ayer });
  return [
    ...cierres.map((cierre) => ({ fecha: cierre.fecha, cierre, noAbrio: false })),
    ...faltan.map((fecha) => sinCierre(fecha, false)),
    ...diasQueNoAbrio({ conCierre, sinAbrir }).map((fecha) => sinCierre(fecha, true)),
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

/** Los cierres que ya tienen diferencia, del mas viejo al mas nuevo, para el grafico. */
export const diferenciasDelGrafico = (cierres: CierreDelReporte[]) =>
  cierres
    .filter((c) => c.diferenciaCentavos !== null)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((c) => ({ nombre: fechaParaMostrar(c.fecha), montoCentavos: c.diferenciaCentavos! }));

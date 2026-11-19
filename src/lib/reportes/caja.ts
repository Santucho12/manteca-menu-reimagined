import { fechaParaMostrar } from '../gastos/pantalla';
import { diasQueNoAbrio } from '../caja/dias';
import type { Turno } from '../caja/turnos';

export type CierreDelReporte = {
  fecha: string;
  turno: Turno;
  persona: string;
  declaradoCentavos: number;
  diferenciaCentavos: number | null;
};
export type FilaDeCaja = {
  fecha: string;
  turno: Turno | null;
  cierre: CierreDelReporte | null;
  noAbrio: boolean;
};
export type ResumenDeEmpleado = {
  persona: string;
  cierres: number;
  diferenciaCentavos: number | null;
};

const orden = (fila: FilaDeCaja) => `${fila.fecha}|${fila.turno ?? 3}`;

const noAbrio = (fecha: string): FilaDeCaja => ({
  fecha,
  turno: null,
  cierre: null,
  noAbrio: true,
});

/** Los cierres, los turnos pendientes y los dias que el local no abrio, del mas nuevo al mas viejo. */
export function filasDeCaja(
  cierres: CierreDelReporte[],
  pendientes: { fecha: string; turno: Turno }[],
  sinAbrir: string[] = [],
): FilaDeCaja[] {
  const conCierre = cierres.map((c) => c.fecha);
  return [
    ...cierres.map((cierre) => ({
      fecha: cierre.fecha,
      turno: cierre.turno,
      cierre,
      noAbrio: false,
    })),
    ...pendientes.map(({ fecha, turno }) => ({ fecha, turno, cierre: null, noAbrio: false })),
    ...diasQueNoAbrio({ conCierre, sinAbrir }).map(noAbrio),
  ].sort((a, b) => orden(b).localeCompare(orden(a)));
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

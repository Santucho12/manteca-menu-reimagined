import { formatearPesos } from '../plata';

export type Variacion = { diferenciaCentavos: number; porcentaje: number | null } | null;

/** Contra un periodo sin datos no hay variacion; contra cero, solo la diferencia. */
export function variacion(actual: number, anterior: number | null): Variacion {
  if (anterior === null) return null;
  const diferenciaCentavos = actual - anterior;
  const porcentaje =
    anterior === 0 ? null : Math.round((diferenciaCentavos * 1000) / Math.abs(anterior)) / 10;
  return { diferenciaCentavos, porcentaje };
}

/** Cada fila contra la misma del otro periodo; sin el otro periodo, ninguna compara. */
export function compararFilas<T>(
  actuales: T[],
  anteriores: T[] | null,
  clave: (fila: T) => string,
  monto: (fila: T) => number,
): { fila: T; variacion: Variacion }[] {
  const previos = new Map((anteriores ?? []).map((f) => [clave(f), monto(f)]));
  return actuales.map((fila) => ({
    fila,
    variacion: variacion(monto(fila), previos.get(clave(fila)) ?? null),
  }));
}

const signo = (numero: number) => (numero > 0 ? '+' : numero < 0 ? '-' : '');
const porciento = (p: number) => `${signo(p)}${String(Math.abs(p)).replace('.', ',')} %`;

export function textoDeVariacion(v: Variacion): string {
  if (!v) return 'Sin datos para comparar';
  const pesos = `${signo(v.diferenciaCentavos)}${formatearPesos(Math.abs(v.diferenciaCentavos))}`;
  return v.porcentaje === null ? pesos : `${pesos} (${porciento(v.porcentaje)})`;
}

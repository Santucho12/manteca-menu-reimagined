import type { Variacion } from '../reportes/comparacion';

export type EstadoDeVariacion = 'mejora' | 'empeora' | 'igual' | 'sin-datos';

/** En gastos, subir es malo: ahi el sentido se invierte. */
export function estadoDeVariacion(etiqueta: string, v: Variacion): EstadoDeVariacion {
  if (!v) return 'sin-datos';
  if (v.diferenciaCentavos === 0) return 'igual';
  const subio = v.diferenciaCentavos > 0;
  const buenoSiSube = etiqueta !== 'Gastos';
  return subio === buenoSiSube ? 'mejora' : 'empeora';
}

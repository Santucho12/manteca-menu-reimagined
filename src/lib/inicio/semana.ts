import { sumarDias, type Periodo } from '../reportes/periodos';
import type { VentaDelDia } from '../reportes/ventas';

export type DiaDeLaSemana = { dia: string; etiqueta: string; actual: number; anterior: number };

const NOMBRES = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

/** Los ultimos 7 dias y los 7 anteriores: lo que hay que traer para compararlos. */
export const ultimosCatorceDias = (hoy: string): Periodo => ({
  desde: sumarDias(hoy, -13),
  hasta: hoy,
});

// Se lee el dia de la semana en UTC al mediodia: no depende de la zona de quien mira.
const etiquetaDe = (dia: string) =>
  `${NOMBRES[new Date(`${dia}T12:00:00Z`).getUTCDay()]} ${Number(dia.slice(8))}`;

/** La cantidad de ventas de cada uno de los ultimos 7 dias, contra el mismo dia de la semana anterior. */
export function semanaContraSemana(ventas: VentaDelDia[], hoy: string): DiaDeLaSemana[] {
  const cantidad = new Map(ventas.map((v) => [v.dia, v.ventas]));
  return [6, 5, 4, 3, 2, 1, 0].map((atras) => {
    const dia = sumarDias(hoy, -atras);
    const anterior = cantidad.get(sumarDias(dia, -7)) ?? 0;
    return { dia, etiqueta: etiquetaDe(dia), actual: cantidad.get(dia) ?? 0, anterior };
  });
}

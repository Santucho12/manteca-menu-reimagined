import { sumarDias, type Periodo } from '../reportes/periodos';
import type { VentaDelDia } from '../reportes/ventas';

export type DiaDeLaSemana = { dia: string; etiqueta: string; actual: number; anterior: number };

const NOMBRES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Se lee el dia de la semana en UTC al mediodia: no depende de la zona de quien mira.
const diaDeLaSemana = (dia: string) => new Date(`${dia}T12:00:00Z`).getUTCDay();

/** Desde hace 14 dias hasta ayer: las dos semanas de 7 dias que se comparan. */
export const rangoDeSemanas = (hoy: string): Periodo => ({
  desde: sumarDias(hoy, -14),
  hasta: sumarDias(hoy, -1),
});

/** Los 7 dias que terminan ayer, de viejo a nuevo, contra el mismo dia de la semana anterior. */
export function semanaContraSemana(ventas: VentaDelDia[], hoy: string): DiaDeLaSemana[] {
  const cantidad = new Map(ventas.map((v) => [v.dia, v.ventas]));
  return Array.from({ length: 7 }, (_, i) => {
    const dia = sumarDias(hoy, i - 7);
    const anterior = cantidad.get(sumarDias(dia, -7)) ?? 0;
    const etiqueta = NOMBRES[diaDeLaSemana(dia)]!;
    return { dia, etiqueta, actual: cantidad.get(dia) ?? 0, anterior };
  });
}

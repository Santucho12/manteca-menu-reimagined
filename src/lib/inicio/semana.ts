import { sumarDias, type Periodo } from '../reportes/periodos';
import type { VentaDelDia } from '../reportes/ventas';

export type DiaDeLaSemana = { dia: string; etiqueta: string; actual: number; anterior: number };

const NOMBRES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Se lee el dia de la semana en UTC al mediodia: no depende de la zona de quien mira.
const diaDeLaSemana = (dia: string) => new Date(`${dia}T12:00:00Z`).getUTCDay();

/** El lunes de la semana de hoy: el punto de partida de las dos semanas. */
const lunesDe = (hoy: string) => sumarDias(hoy, -((diaDeLaSemana(hoy) + 6) % 7));

/** Desde el lunes de la semana anterior hasta el domingo de esta: lo que hay que traer para compararlas. */
export const rangoDeSemanas = (hoy: string): Periodo => ({
  desde: sumarDias(lunesDe(hoy), -7),
  hasta: sumarDias(lunesDe(hoy), 6),
});

/** Cada dia de la semana de hoy (de lunes a domingo) contra el mismo dia de la semana anterior. */
export function semanaContraSemana(ventas: VentaDelDia[], hoy: string): DiaDeLaSemana[] {
  const cantidad = new Map(ventas.map((v) => [v.dia, v.ventas]));
  const lunes = lunesDe(hoy);
  return [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const dia = sumarDias(lunes, i);
    const anterior = cantidad.get(sumarDias(dia, -7)) ?? 0;
    const etiqueta = NOMBRES[diaDeLaSemana(dia)]!;
    return { dia, etiqueta, actual: cantidad.get(dia) ?? 0, anterior };
  });
}

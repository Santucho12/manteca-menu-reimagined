import { formatearPesosRedondeados } from '../plata';
import { pesosCortos } from '../reportes/ejeCorto';
import type { EstadoDeVariacion } from './estadoDeVariacion';
import type { DiaDeLaSemana } from './semana';

export type PuntoAcumulado = {
  etiqueta: string;
  actual: number;
  anterior: number;
  /** Lo vendido ese día solo, para el cartelito: la línea muestra lo acumulado. */
  delDia: number;
  delDiaAnterior: number;
};
export type ResumenDeLaSemana = { titulo: string; chip: string; estado: EstadoDeVariacion };

/** Las ventas de cada semana sumadas día a día: un día sin ventas deja la línea plana. */
export function acumularSemana(dias: DiaDeLaSemana[]): PuntoAcumulado[] {
  let actual = 0;
  let anterior = 0;
  return dias.map((d) => {
    actual += d.actual;
    anterior += d.anterior;
    return {
      etiqueta: d.etiqueta,
      actual,
      anterior,
      delDia: d.actual,
      delDiaAnterior: d.anterior,
    };
  });
}

/** Si vas adelantado o atrasado contra la semana anterior, en pesos: una frase y una etiqueta. */
export function resumenDeLaSemana(dias: DiaDeLaSemana[]): ResumenDeLaSemana {
  const total = acumularSemana(dias).at(-1) ?? { actual: 0, anterior: 0 };
  const diferencia = total.actual - total.anterior;
  const cifras = `${pesosCortos(total.actual)} vs ${pesosCortos(total.anterior)}`;
  const monto = formatearPesosRedondeados(Math.abs(diferencia));
  if (diferencia > 0)
    return { titulo: `Vas ${monto} arriba`, chip: `▲ ${cifras}`, estado: 'mejora' };
  if (diferencia < 0)
    return { titulo: `Vas ${monto} abajo`, chip: `▼ ${cifras}`, estado: 'empeora' };
  return { titulo: 'Vas igual que la semana pasada', chip: `= ${cifras}`, estado: 'igual' };
}

/** Lo que aparece al pasar el mouse por la frase y por la etiqueta de la semana. */
export const AYUDAS_DE_LA_SEMANA = {
  titulo:
    'Cuánto más o menos vendiste en los últimos 7 días, con lo de hoy hasta ahora, contra los 7 días anteriores.',
  chip: 'Lo vendido en los últimos 7 días contra lo vendido en los 7 días anteriores.',
} as const;

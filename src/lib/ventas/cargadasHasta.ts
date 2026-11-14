import { sumarDias } from '../reportes/periodos';

export type CargadasHasta = { texto: string; atrasado: boolean };

// El dia y el mes alcanzan para lo reciente; el año solo si no es el de hoy.
function diaCorto(fecha: string, hoy: string): string {
  const [anio, mes, dia] = fecha.split('-');
  return anio === hoy.slice(0, 4) ? `${dia}/${mes}` : `${dia}/${mes}/${anio}`;
}

/** Hasta que dia hay ventas de Fudo; quedo atras si le falta mas que ayer. */
export function textoDeCargadasHasta(fecha: string | null, hoy: string): CargadasHasta {
  if (!fecha) return { texto: 'Todavía no se subieron ventas de Fudo', atrasado: true };
  return {
    texto: `Ventas de Fudo cargadas hasta el ${diaCorto(fecha, hoy)}`,
    atrasado: fecha < sumarDias(hoy, -1),
  };
}

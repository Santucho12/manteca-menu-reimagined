import { formatearPesos } from '../plata';
import type { EstadoDelCierre } from './resultado';

/** Lo que devuelve cierres_controles: lo anotado de un tipo y lo cargado de ese tipo en el turno. */
export type ControlLeido = {
  cierre_id: string;
  canal_id: string;
  tipo: string;
  cantidad: number | null;
  total_centavos: number;
  ventas_cantidad: number;
  ventas_centavos: number;
};

export type ResultadoDeControl = {
  canalId: string;
  tipo: string;
  anotadoCentavos: number;
  cargadoCentavos: number;
  /** Lo facturado menos lo cargado: positivo es que falta cargar algo. */
  diferenciaCentavos: number;
  cantidadAnotada: number | null;
  cantidadCargada: number;
  fuera: boolean;
};

/** Lo que dice la facturación de un tipo contra lo cargado; la cantidad, solo si se anotó. */
export function resultadoDeControl(
  c: ControlLeido,
  toleranciaCentavos: number,
): ResultadoDeControl {
  const diferenciaCentavos = c.total_centavos - c.ventas_centavos;
  const cantidadDistinta = c.cantidad !== null && c.cantidad !== c.ventas_cantidad;
  return {
    canalId: c.canal_id,
    tipo: c.tipo,
    anotadoCentavos: c.total_centavos,
    cargadoCentavos: c.ventas_centavos,
    diferenciaCentavos,
    cantidadAnotada: c.cantidad,
    cantidadCargada: c.ventas_cantidad,
    fuera: Math.abs(diferenciaCentavos) > toleranciaCentavos || cantidadDistinta,
  };
}

/** El cierre da con diferencia si la caja o alguno de sus tipos no da. */
export const estadoConControles = (
  estadoDeLaCaja: EstadoDelCierre,
  controles: ResultadoDeControl[],
): EstadoDelCierre =>
  estadoDeLaCaja === 'con_diferencia' || controles.some((c) => c.fuera)
    ? 'con_diferencia'
    : 'cierra';

/** Los controles de cada cierre, con su resultado. */
export function controlesPorCierre(leidos: ControlLeido[], toleranciaCentavos: number) {
  const grupos = new Map<string, ResultadoDeControl[]>();
  for (const leido of leidos) {
    const lista = grupos.get(leido.cierre_id) ?? [];
    grupos.set(leido.cierre_id, [...lista, resultadoDeControl(leido, toleranciaCentavos)]);
  }
  return grupos;
}

/** El resultado de un tipo en palabras: correcto, lo que falta cargar o lo que sobra. */
export function textoDelControl(c: ResultadoDeControl): string {
  if (!c.fuera) return 'Da correcto';
  if (c.diferenciaCentavos > 0) return `Faltan cargar ${formatearPesos(c.diferenciaCentavos)}`;
  if (c.diferenciaCentavos < 0)
    return `Hay ${formatearPesos(-c.diferenciaCentavos)} cargados de más`;
  return `Se anotaron ${c.cantidadAnotada} ventas y hay ${c.cantidadCargada} cargadas`;
}

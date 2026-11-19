import { unValor } from '../usuarios/presentacion';
import type { FiltroDeCostos, FiltrosDeCostos, OrdenDeCostos } from './lista';

export type ParametrosDeCostos = Record<string, string | string[] | undefined>;

const FILTROS: FiltroDeCostos[] = ['todos', 'debajo', 'sin_receta'];
const ORDENES: OrdenDeCostos[] = ['porcentaje', 'nombre'];

/** El filtro y el orden de la lista, leidos de la URL: asi el aviso de Inicio lleva filtrado. */
export function filtrosDeCostos(parametros: ParametrosDeCostos): FiltrosDeCostos {
  const filtro = unValor(parametros.filtro) as FiltroDeCostos;
  const orden = unValor(parametros.orden) as OrdenDeCostos;
  return {
    filtro: FILTROS.includes(filtro) ? filtro : 'todos',
    orden: ORDENES.includes(orden) ? orden : 'porcentaje',
  };
}

export function enlaceDeCostos({ filtro, orden }: FiltrosDeCostos): string {
  const parametros = new URLSearchParams();
  if (filtro !== 'todos') parametros.set('filtro', filtro);
  if (orden !== 'porcentaje') parametros.set('orden', orden);
  const texto = parametros.toString();
  return texto ? `/admin/costos?${texto}` : '/admin/costos';
}

const VACIOS: Record<FiltroDeCostos, { titulo: string; texto: string }> = {
  todos: {
    titulo: 'Todavía no hay productos en el menú',
    texto: 'Cargalos en Menú y después su receta acá.',
  },
  debajo: {
    titulo: 'Ningún producto está debajo del mínimo',
    texto: 'Todos los que tienen costo dejan al menos el margen mínimo.',
  },
  sin_receta: { titulo: 'Todos tienen receta', texto: 'No queda ningún producto sin receta.' },
};

export const vacioDeCostos = (filtro: FiltroDeCostos) => VACIOS[filtro];

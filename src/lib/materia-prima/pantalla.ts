import { numeroDePagina, unValor } from '../usuarios/presentacion';
import type { FiltrosDeInsumos } from './consultas';
import type { UnidadDeUso } from './costo';

const UNIDADES: Record<UnidadDeUso, { texto: string; enElContenido: string }> = {
  g: { texto: 'Gramos', enElContenido: 'gramos' },
  ml: { texto: 'Mililitros', enElContenido: 'mililitros' },
  unidad: { texto: 'Unidades', enElContenido: 'unidades' },
};

export const OPCIONES_DE_UNIDAD = (Object.keys(UNIDADES) as UnidadDeUso[]).map((valor) => ({
  valor,
  texto: UNIDADES[valor].texto,
}));

export const textoDeUnidad = (unidad: UnidadDeUso) => UNIDADES[unidad].texto;

/** El contenido se escribe en la unidad del insumo: la bolsa de 25 kg trae 25.000 gramos. */
export const etiquetaDelContenido = (unidad: UnidadDeUso) =>
  `Cuánto trae, en ${UNIDADES[unidad].enElContenido}`;

export type ParametrosDeInsumos = Record<string, string | string[] | undefined>;

function busquedaDe(texto: string | undefined): string | null {
  const limpio = (texto ?? '').trim().slice(0, 100);
  return limpio === '' ? null : limpio;
}

/** Los filtros de la lista, leidos de la URL: asi se pueden compartir y volver atras. */
export function filtrosDeInsumos(parametros: ParametrosDeInsumos): FiltrosDeInsumos {
  return {
    busqueda: busquedaDe(unValor(parametros.q)),
    desactivados: unValor(parametros.desactivados) === '1',
    pagina: numeroDePagina(unValor(parametros.pagina)),
  };
}

export function enlaceDeInsumos({ busqueda, desactivados, pagina }: FiltrosDeInsumos) {
  const parametros = new URLSearchParams();
  if (busqueda) parametros.set('q', busqueda);
  if (desactivados) parametros.set('desactivados', '1');
  if (pagina > 1) parametros.set('pagina', String(pagina));
  const texto = parametros.toString();
  return texto ? `/admin/materia-prima?${texto}` : '/admin/materia-prima';
}

/** Que dice la lista vacia, segun por que esta vacia. */
export function vacioDeInsumos({ busqueda, desactivados }: FiltrosDeInsumos) {
  if (busqueda) {
    return {
      titulo: 'No se encontraron insumos',
      texto: 'No hay registros que coincidan con tu búsqueda.',
    };
  }
  if (desactivados) {
    return {
      titulo: 'No hay insumos desactivados',
      texto: 'Los que desactives van a aparecer acá.',
    };
  }
  return { titulo: 'Todavía no hay insumos', texto: 'Cargá el primero con Nuevo insumo.' };
}

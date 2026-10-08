import { numeroDePagina, textoDeBusqueda, unValor } from '../usuarios/presentacion';
import type { FiltrosDeProveedores } from './consultas';

export type ParametrosDeProveedores = Record<string, string | string[] | undefined>;

/** Los filtros de la lista, leidos de la URL: asi se pueden compartir y volver atras. */
export function filtrosDeProveedores(parametros: ParametrosDeProveedores): FiltrosDeProveedores {
  return {
    busqueda: textoDeBusqueda(unValor(parametros.q)),
    desactivados: unValor(parametros.desactivados) === '1',
    pagina: numeroDePagina(unValor(parametros.pagina)),
  };
}

export function enlaceDeProveedores({ busqueda, desactivados, pagina }: FiltrosDeProveedores) {
  const parametros = new URLSearchParams();
  if (busqueda) parametros.set('q', busqueda);
  if (desactivados) parametros.set('desactivados', '1');
  if (pagina > 1) parametros.set('pagina', String(pagina));
  const texto = parametros.toString();
  return texto ? `/admin/proveedores?${texto}` : '/admin/proveedores';
}

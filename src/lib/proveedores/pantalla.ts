import { numeroDePagina, unValor } from '../usuarios/presentacion';
import type { FilaDeProveedor, FiltrosDeProveedores } from './consultas';

// La busqueda va tal cual: las comas y los puntos son parte de un nombre. La consulta escapa
// los comodines.
function busquedaDe(texto: string | undefined): string | null {
  const limpio = (texto ?? '').trim().slice(0, 100);
  return limpio === '' ? null : limpio;
}

export type ParametrosDeProveedores = Record<string, string | string[] | undefined>;

/** Los filtros de la lista, leidos de la URL: asi se pueden compartir y volver atras. */
export function filtrosDeProveedores(parametros: ParametrosDeProveedores): FiltrosDeProveedores {
  return {
    busqueda: busquedaDe(unValor(parametros.q)),
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

export type FilaConPagado = FilaDeProveedor & { pagadoCentavos: number };

/** Cada proveedor con lo pagado en el mes; sin gastos en el mes, cero. */
export function filasConPagado(
  filas: FilaDeProveedor[],
  pagado: Map<string, number>,
): FilaConPagado[] {
  return filas.map((fila) => ({ ...fila, pagadoCentavos: pagado.get(fila.id) ?? 0 }));
}

/** Que dice la lista vacia, segun por que esta vacia. */
export function vacioDeProveedores({ busqueda, desactivados }: FiltrosDeProveedores) {
  if (busqueda) {
    return {
      titulo: 'No se encontraron proveedores',
      texto: 'No hay registros que coincidan con tu búsqueda.',
    };
  }
  if (desactivados) {
    return {
      titulo: 'No hay proveedores desactivados',
      texto: 'Los que desactives van a aparecer acá.',
    };
  }
  return { titulo: 'Todavía no hay proveedores', texto: 'Cargá el primero con Nuevo proveedor.' };
}

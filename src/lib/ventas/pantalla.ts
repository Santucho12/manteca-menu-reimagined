import { MEDIOS, type Medio } from '../caja/resultado';
import { mesDe } from '../gastos/pantalla';
import { esFechaValida } from '../gastos/vencimientos';
import { numeroDePagina, unValor } from '../usuarios/presentacion';

export const ORIGENES = ['manual', 'fudo'] as const;
export const ESTADOS_DE_LISTA = ['cerrada', 'cancelada', 'anulada'] as const;
export type Origen = (typeof ORIGENES)[number];
export type EstadoDeLista = (typeof ESTADOS_DE_LISTA)[number];

export type FiltrosDeVentas = {
  desde: string;
  hasta: string;
  origen: Origen | null;
  medio: Medio | null;
  estado: EstadoDeLista | null;
  pagina: number;
};
export type ParametrosDeVentas = Record<string, string | string[] | undefined>;

const NOMBRES_DE_ORIGEN: Record<Origen, string> = { manual: 'A mano', fudo: 'Fudo' };
const NOMBRES_DE_ESTADO: Record<string, string> = {
  cerrada: 'Cerrada',
  cancelada: 'Cancelada',
  en_curso: 'En curso',
};

export const nombreDeOrigen = (origen: Origen) => NOMBRES_DE_ORIGEN[origen];

/** Como se ve el estado: lo anulado manda sobre lo que dijera la venta. */
export function estadoDeVenta(venta: { estado: string; anulado: boolean }): string {
  return venta.anulado ? 'Anulada' : (NOMBRES_DE_ESTADO[venta.estado] ?? venta.estado);
}

function unoDe<T extends string>(lista: readonly T[], texto: string | undefined): T | null {
  return lista.find((valor) => valor === texto) ?? null;
}
const fechaDe = (texto: string | undefined) => (texto && esFechaValida(texto) ? texto : null);

/** Los filtros de la lista, leidos de la URL; sin fechas, el mes de hoy en Argentina. */
export function filtrosDeVentas(parametros: ParametrosDeVentas, hoy: string): FiltrosDeVentas {
  const mes = mesDe(hoy);
  const desde = fechaDe(unValor(parametros.desde)) ?? mes.desde;
  const hasta = fechaDe(unValor(parametros.hasta)) ?? mes.hasta;
  return {
    desde: desde <= hasta ? desde : hasta,
    hasta: desde <= hasta ? hasta : desde,
    origen: unoDe(ORIGENES, unValor(parametros.origen)),
    medio: unoDe(MEDIOS, unValor(parametros.medio)),
    estado: unoDe(ESTADOS_DE_LISTA, unValor(parametros.estado)),
    pagina: numeroDePagina(unValor(parametros.pagina)),
  };
}

export function enlaceDeVentas(filtros: FiltrosDeVentas, hoy: string): string {
  const mes = mesDe(hoy);
  const parametros = new URLSearchParams();
  if (filtros.desde !== mes.desde) parametros.set('desde', filtros.desde);
  if (filtros.hasta !== mes.hasta) parametros.set('hasta', filtros.hasta);
  if (filtros.origen) parametros.set('origen', filtros.origen);
  if (filtros.medio) parametros.set('medio', filtros.medio);
  if (filtros.estado) parametros.set('estado', filtros.estado);
  if (filtros.pagina > 1) parametros.set('pagina', String(filtros.pagina));
  const texto = parametros.toString();
  return texto ? `/admin/ventas?${texto}` : '/admin/ventas';
}

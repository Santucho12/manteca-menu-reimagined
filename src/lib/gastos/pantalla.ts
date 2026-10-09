import { z } from 'zod';
import { numeroDePagina, unValor } from '../usuarios/presentacion';
import type { FRECUENCIAS, MedioDePago } from './esquemas';
import { esFechaValida, sumarMeses } from './vencimientos';

export type FiltrosDeGastos = {
  desde: string;
  hasta: string;
  categoriaId: string | null;
  proveedorId: string | null;
  pagina: number;
};
export type ParametrosDeGastos = Record<string, string | string[] | undefined>;

const MEDIOS: Record<MedioDePago, string> = {
  efectivo_caja: 'Efectivo de la caja',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  otro: 'Otro',
};
const FRECUENCIAS_EN_TEXTO: Record<(typeof FRECUENCIAS)[number], string> = {
  mensual: 'Todos los meses',
  bimestral: 'Cada dos meses',
  anual: 'Una vez por año',
};

export const nombreDeMedio = (medio: MedioDePago) => MEDIOS[medio];
export const nombreDeFrecuencia = (frecuencia: (typeof FRECUENCIAS)[number]) =>
  FRECUENCIAS_EN_TEXTO[frecuencia];

/** El primer y el ultimo dia del mes de una fecha. */
export function mesDe(fecha: string): { desde: string; hasta: string } {
  // El 31 que no existe en el mes se recorta al ultimo dia.
  return { desde: `${fecha.slice(0, 8)}01`, hasta: sumarMeses(`${fecha.slice(0, 8)}31`, 0) };
}

const fechaDe = (texto: string | undefined) => (texto && esFechaValida(texto) ? texto : null);
const idDe = (texto: string | undefined) => (z.uuid().safeParse(texto).success ? texto! : null);

/** Los filtros de la lista, leidos de la URL; sin fechas, el mes de hoy en Argentina. */
export function filtrosDeGastos(parametros: ParametrosDeGastos, hoy: string): FiltrosDeGastos {
  const mes = mesDe(hoy);
  const desde = fechaDe(unValor(parametros.desde)) ?? mes.desde;
  const hasta = fechaDe(unValor(parametros.hasta)) ?? mes.hasta;
  return {
    desde: desde <= hasta ? desde : hasta,
    hasta: desde <= hasta ? hasta : desde,
    categoriaId: idDe(unValor(parametros.categoria)),
    proveedorId: idDe(unValor(parametros.proveedor)),
    pagina: numeroDePagina(unValor(parametros.pagina)),
  };
}

export function enlaceDeGastos(filtros: FiltrosDeGastos, hoy: string): string {
  const mes = mesDe(hoy);
  const parametros = new URLSearchParams();
  if (filtros.desde !== mes.desde) parametros.set('desde', filtros.desde);
  if (filtros.hasta !== mes.hasta) parametros.set('hasta', filtros.hasta);
  if (filtros.categoriaId) parametros.set('categoria', filtros.categoriaId);
  if (filtros.proveedorId) parametros.set('proveedor', filtros.proveedorId);
  if (filtros.pagina > 1) parametros.set('pagina', String(filtros.pagina));
  const texto = parametros.toString();
  return texto ? `/admin/gastos?${texto}` : '/admin/gastos';
}

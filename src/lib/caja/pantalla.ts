import { z } from 'zod';
import { mesDe } from '../gastos/pantalla';
import { esFechaValida } from '../gastos/vencimientos';
import { numeroDePagina, unValor } from '../usuarios/presentacion';
import type { Medio } from './resultado';

export const ESTADOS = [
  'esperando_ventas',
  'cierra',
  'con_diferencia',
  'revisado',
  'anulado',
] as const;
export type EstadoDeCierre = (typeof ESTADOS)[number];

export type FiltrosDeControl = {
  desde: string;
  hasta: string;
  personaId: string | null;
  estado: EstadoDeCierre | null;
  pagina: number;
};
export type ParametrosDeControl = Record<string, string | string[] | undefined>;

const NOMBRES_DE_ESTADO: Record<EstadoDeCierre, string> = {
  esperando_ventas: 'Esperando ventas',
  cierra: 'Cierra',
  con_diferencia: 'Con diferencia',
  revisado: 'Revisado',
  anulado: 'Anulado',
};
const NOMBRES_DE_MEDIO: Record<Medio, string> = {
  efectivo: 'Efectivo',
  credito: 'Tarjeta de crédito',
  debito: 'Tarjeta de débito',
  qr: 'QR',
  transferencia: 'Transferencia',
};

export const nombreDeEstado = (estado: EstadoDeCierre) => NOMBRES_DE_ESTADO[estado];
export const nombreDeMedio = (medio: Medio) => NOMBRES_DE_MEDIO[medio];
export const opcionesDeEstado = () =>
  ESTADOS.map((estado) => ({ valor: estado as string, texto: NOMBRES_DE_ESTADO[estado] }));

const fechaDe = (texto: string | undefined) => (texto && esFechaValida(texto) ? texto : null);
const idDe = (texto: string | undefined) => (z.uuid().safeParse(texto).success ? texto! : null);
const estadoDe = (texto: string | undefined) => ESTADOS.find((estado) => estado === texto) ?? null;

/** Los filtros del control, leidos de la URL; sin fechas, el mes de hoy en Argentina. */
export function filtrosDeControl(parametros: ParametrosDeControl, hoy: string): FiltrosDeControl {
  const mes = mesDe(hoy);
  const desde = fechaDe(unValor(parametros.desde)) ?? mes.desde;
  const hasta = fechaDe(unValor(parametros.hasta)) ?? mes.hasta;
  return {
    desde: desde <= hasta ? desde : hasta,
    hasta: desde <= hasta ? hasta : desde,
    personaId: idDe(unValor(parametros.persona)),
    estado: estadoDe(unValor(parametros.estado)),
    pagina: numeroDePagina(unValor(parametros.pagina)),
  };
}

export function enlaceDeControl(filtros: FiltrosDeControl, hoy: string): string {
  const mes = mesDe(hoy);
  const parametros = new URLSearchParams();
  if (filtros.desde !== mes.desde) parametros.set('desde', filtros.desde);
  if (filtros.hasta !== mes.hasta) parametros.set('hasta', filtros.hasta);
  if (filtros.personaId) parametros.set('persona', filtros.personaId);
  if (filtros.estado) parametros.set('estado', filtros.estado);
  if (filtros.pagina > 1) parametros.set('pagina', String(filtros.pagina));
  const texto = parametros.toString();
  return texto ? `/admin/caja/control?${texto}` : '/admin/caja/control';
}

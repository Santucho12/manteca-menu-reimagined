import { z } from 'zod';
import { mesDe } from '../gastos/pantalla';
import { esFechaValida } from '../gastos/vencimientos';
import { formatearPesos } from '../plata';
import { numeroDePagina, unValor } from '../usuarios/presentacion';
import type { Tono } from '../../components/panel/Insignias';
import type { Medio } from './resultado';

// Pendiente y "no abrio" son dias sin cierre; los otros tres son el estado de un cierre cargado.
export const ESTADOS = [
  'cierra',
  'con_diferencia',
  'esperando_ventas',
  'pendiente',
  'no_abrio',
] as const;
export type EstadoDeCierre = (typeof ESTADOS)[number];

export type FiltrosDeControl = {
  desde: string;
  hasta: string;
  personaId: string | null;
  estado: EstadoDeCierre | null;
  /** Los cierres anulados no se muestran salvo que se pidan. */
  anulados: boolean;
  pagina: number;
};
export type ParametrosDeControl = Record<string, string | string[] | undefined>;

const NOMBRES_DE_ESTADO: Record<EstadoDeCierre, string> = {
  cierra: 'Cierra',
  con_diferencia: 'Con diferencia',
  esperando_ventas: 'Esperando ventas',
  pendiente: 'Pendiente',
  no_abrio: 'No abrió',
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
    anulados: unValor(parametros.anulados) === '1',
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
  if (filtros.anulados) parametros.set('anulados', '1');
  if (filtros.pagina > 1) parametros.set('pagina', String(filtros.pagina));
  const texto = parametros.toString();
  return texto ? `/admin/caja/control?${texto}` : '/admin/caja/control';
}

/** La diferencia como se le dice a una persona: faltan o sobran, nunca un numero negativo. */
export function textoDeDiferencia(centavos: number | null): string {
  if (centavos === null) return '—';
  if (centavos === 0) return 'Sin diferencia';
  return `${centavos < 0 ? 'Faltan' : 'Sobran'} ${formatearPesos(Math.abs(centavos))}`;
}

const TONOS: Record<EstadoDeCierre, Tono> = {
  cierra: 'esmeralda',
  con_diferencia: 'rosa',
  esperando_ventas: 'ambar',
  pendiente: 'ambar',
  no_abrio: 'pizarra',
};

/** El color de la insignia de un cierre; uno anulado se ve apagado. */
export const tonoDelCierre = (cierre: { estado: EstadoDeCierre; anulado: boolean }): Tono =>
  cierre.anulado ? 'pizarra' : TONOS[cierre.estado];

/** Esos estados listan dias, no cierres: la lista de cierres no se muestra. */
export const sinCierresCargados = (estado: EstadoDeCierre | null): boolean =>
  estado === 'pendiente' || estado === 'no_abrio';

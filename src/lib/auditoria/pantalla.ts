import { z } from 'zod';
import { esFechaValida, sumarMeses } from '../gastos/vencimientos';
import { numeroDePagina, unValor } from '../usuarios/presentacion';
import { ACCIONES } from './diccionario';

export const MODULOS = {
  usuarios: { nombre: 'Usuarios', tablas: ['perfiles', 'locales'] },
  menu: {
    nombre: 'Menú',
    tablas: ['categorias', 'presentaciones', 'productos', 'precios', 'aumentos'],
  },
  proveedores: { nombre: 'Proveedores', tablas: ['proveedores'] },
  gastos: {
    nombre: 'Gastos',
    tablas: ['gastos', 'gastos_recurrentes', 'gastos_por_pagar', 'categorias_de_gasto'],
  },
  ventas: {
    nombre: 'Ventas',
    tablas: ['ventas', 'renglones_de_venta', 'pagos_de_venta', 'canales_de_venta'],
  },
  caja: {
    nombre: 'Caja',
    tablas: ['cierres_de_caja', 'retiros_de_caja', 'configuracion_de_caja', 'dias_sin_abrir'],
  },
} as const;

export type Modulo = keyof typeof MODULOS;
export type FiltrosDeAuditoria = {
  desde: string;
  hasta: string;
  /** Un id de persona, o "sistema" para los procesos automaticos. */
  persona: string | null;
  modulo: Modulo | null;
  accion: string | null;
  pagina: number;
};
export type ParametrosDeAuditoria = Record<string, string | string[] | undefined>;

export const tablasDe = (modulo: Modulo): string[] => [...MODULOS[modulo].tablas];

const DIAS_POR_DEFECTO = 7;

/** Hoy menos n dias, contando dias de calendario. */
function diasAntes(hoy: string, dias: number): string {
  const tiempo = Date.parse(`${hoy}T12:00:00Z`) - dias * 86_400_000;
  // sumarMeses con 0 deja el texto en el formato del proyecto.
  return sumarMeses(new Date(tiempo).toISOString().slice(0, 10), 0);
}

const fechaDe = (texto: string | undefined) => (texto && esFechaValida(texto) ? texto : null);
const personaDe = (texto: string | undefined) =>
  texto === 'sistema' || z.uuid().safeParse(texto).success ? texto! : null;
const moduloDe = (texto: string | undefined) =>
  texto && texto in MODULOS ? (texto as Modulo) : null;
const accionDe = (texto: string | undefined) => (texto && texto in ACCIONES ? texto : null);

/** Los filtros, leidos de la URL; sin fechas, los ultimos siete dias en Argentina. */
export function filtrosDeAuditoria(
  parametros: ParametrosDeAuditoria,
  hoy: string,
): FiltrosDeAuditoria {
  const desde = fechaDe(unValor(parametros.desde)) ?? diasAntes(hoy, DIAS_POR_DEFECTO - 1);
  const hasta = fechaDe(unValor(parametros.hasta)) ?? hoy;
  return {
    desde: desde <= hasta ? desde : hasta,
    hasta: desde <= hasta ? hasta : desde,
    persona: personaDe(unValor(parametros.persona)),
    modulo: moduloDe(unValor(parametros.modulo)),
    accion: accionDe(unValor(parametros.accion)),
    pagina: numeroDePagina(unValor(parametros.pagina)),
  };
}

export function enlaceDeAuditoria(filtros: FiltrosDeAuditoria, hoy: string): string {
  const parametros = new URLSearchParams();
  if (filtros.desde !== diasAntes(hoy, DIAS_POR_DEFECTO - 1))
    parametros.set('desde', filtros.desde);
  if (filtros.hasta !== hoy) parametros.set('hasta', filtros.hasta);
  if (filtros.persona) parametros.set('persona', filtros.persona);
  if (filtros.modulo) parametros.set('modulo', filtros.modulo);
  if (filtros.accion) parametros.set('accion', filtros.accion);
  if (filtros.pagina > 1) parametros.set('pagina', String(filtros.pagina));
  const texto = parametros.toString();
  return texto ? `/admin/auditoria?${texto}` : '/admin/auditoria';
}

export const opcionesDeModulo = () =>
  Object.entries(MODULOS).map(([valor, modulo]) => ({ valor, texto: modulo.nombre as string }));

export const opcionesDeAccion = () =>
  Object.entries(ACCIONES).map(([valor, texto]) => ({ valor, texto }));

import { z } from 'zod';
import { numeroDePagina, unValor } from '../usuarios/presentacion';
import type { TipoDeCarga } from './escritura';
import type { FRECUENCIAS, MedioDePago } from './esquemas';
import { esElMesDeHoy, mesDeLaUrl, rangoDelMes } from './meses';
import { sumarMeses } from './vencimientos';

/** Fijos: los que cargó un gasto fijo. Caja: los que vinieron de un cierre. */
export type TipoDeGasto = 'fijos' | 'caja';
export type FiltrosDeGastos = {
  mes: string;
  desde: string;
  hasta: string;
  tipo: TipoDeGasto | null;
  categoriaId: string | null;
  pagina: number;
};
export type ParametrosDeGastos = Record<string, string | string[] | undefined>;

const MEDIOS: Record<MedioDePago, string> = {
  efectivo_caja: 'Efectivo de la caja',
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  cheque: 'Cheque',
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

const idDe = (texto: string | undefined) => (z.uuid().safeParse(texto).success ? texto! : null);
const tipoDe = (texto: string | undefined): TipoDeGasto | null =>
  texto === 'fijos' || texto === 'caja' ? texto : null;

/** Los filtros de Pagados, leídos de la URL; sin mes, el de hoy en Argentina. */
export function filtrosDeGastos(parametros: ParametrosDeGastos, hoy: string): FiltrosDeGastos {
  const mes = mesDeLaUrl(unValor(parametros.mes), hoy);
  return {
    mes,
    ...rangoDelMes(mes),
    tipo: tipoDe(unValor(parametros.tipo)),
    categoriaId: idDe(unValor(parametros.categoria)),
    pagina: numeroDePagina(unValor(parametros.pagina)),
  };
}

export function enlaceDeGastos(
  filtros: Pick<FiltrosDeGastos, 'mes' | 'tipo' | 'categoriaId' | 'pagina'>,
  hoy: string,
): string {
  const parametros = new URLSearchParams();
  if (!esElMesDeHoy(filtros.mes, hoy)) parametros.set('mes', filtros.mes);
  if (filtros.tipo) parametros.set('tipo', filtros.tipo);
  if (filtros.categoriaId) parametros.set('categoria', filtros.categoriaId);
  if (filtros.pagina > 1) parametros.set('pagina', String(filtros.pagina));
  const texto = parametros.toString();
  return texto ? `/admin/gastos?${texto}` : '/admin/gastos';
}

export type OpcionDeLista = { valor: string; texto: string };

/** Lo activo, y lo desactivado solo si es lo que ya tenia: asi un gasto viejo no lo pierde. */
export function opcionesParaElegir(
  lista: { id: string; nombre: string; activo: boolean }[],
  actual: string,
  vacio: string,
): OpcionDeLista[] {
  const elegibles = lista.filter((item) => item.activo || item.id === actual);
  return [
    { valor: '', texto: vacio },
    ...elegibles.map((item) => ({
      valor: item.id,
      texto: item.activo ? item.nombre : `${item.nombre} (desactivado)`,
    })),
  ];
}

/** AAAA-MM-DD como se lee aca: 08/10/2026. */
export function fechaParaMostrar(fecha: string): string {
  return fecha.split('-').reverse().join('/');
}

/** El efectivo de la caja sale por el cierre: solo se ve en un gasto que ya lo tenia. */
export const opcionesDeMedio = (actual?: MedioDePago | ''): OpcionDeLista[] =>
  Object.entries(MEDIOS)
    .filter(([valor]) => valor !== 'efectivo_caja' || actual === 'efectivo_caja')
    .map(([valor, texto]) => ({ valor, texto }));

export const opcionesDeFrecuencia = (): OpcionDeLista[] =>
  Object.entries(FRECUENCIAS_EN_TEXTO).map(([valor, texto]) => ({ valor, texto }));

const AVISOS_DE_CARGA: Record<TipoDeCarga, string> = {
  gasto: 'Gasto cargado',
  fijo: 'Gasto fijo creado',
  porPagar: 'Quedó por pagar',
};

/** El aviso al guardar una carga: dice qué quedó anotado. */
export const avisoDeLaCarga = (tipo: TipoDeCarga) => AVISOS_DE_CARGA[tipo];

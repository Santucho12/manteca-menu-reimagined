import type { MedioDePago } from './esquemas';
import { nombreDeFrecuencia, nombreDeMedio } from './pantalla';
import type { Frecuencia } from './vencimientos';

const MESES_CORTOS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

type ConNombre = { descripcion: string | null; categoria: string };

/** Lo que se lee primero: lo que escribió quien lo cargó, o la categoría si no escribió nada. */
export const nombreDelGasto = (gasto: ConNombre) => gasto.descripcion ?? gasto.categoria;

export function detalleDelGasto(
  gasto: ConNombre & { proveedor: string | null; medio_de_pago: MedioDePago },
): string {
  const categoria = gasto.descripcion ? gasto.categoria : null;
  return [categoria, gasto.proveedor, nombreDeMedio(gasto.medio_de_pago)]
    .filter(Boolean)
    .join(' · ');
}

export function marcasDelGasto(gasto: {
  frecuencia: Frecuencia | null;
  cierre_id: string | null;
  anulado: boolean;
}): string[] {
  const marcas = [
    gasto.frecuencia ? `Fijo · ${nombreDeFrecuencia(gasto.frecuencia)}` : null,
    gasto.cierre_id ? 'De caja' : null,
    gasto.anulado ? 'Anulado' : null,
  ];
  return marcas.filter((marca): marca is string => marca !== null);
}

export function fechaCorta(fecha: string): { dia: string; mes: string } {
  const [, mes, dia] = fecha.split('-').map(Number) as [number, number, number];
  return { dia: String(dia), mes: MESES_CORTOS[mes - 1]! };
}

export type TonoDeMarca = 'violeta' | 'celeste' | 'ambar';

/** Cada frecuencia de un fijo se pinta distinto; el resto de las marcas, en violeta. */
export function tonoDeLaMarca(marca: string): TonoDeMarca {
  if (marca === `Fijo · ${nombreDeFrecuencia('bimestral')}`) return 'celeste';
  if (marca === `Fijo · ${nombreDeFrecuencia('anual')}`) return 'ambar';
  return 'violeta';
}

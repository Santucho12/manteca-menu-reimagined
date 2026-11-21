import { sumarDias } from '../../src/lib/reportes/periodos';
import { crearAzar, entero, type Azar } from './azar';
import { cierreDelDia, type CierreDeEjemplo } from './cierres';
import { gastosDelPeriodo, type GastoDeEjemplo } from './gastos';
import {
  ventasAManoDelDia,
  ventasDelDia,
  type FormaDeEjemplo,
  type VentaAManoDeEjemplo,
  type VentaDeEjemplo,
} from './ventas';

/** Todo lo inventado, listo para escribir en la base. */
export type PlanDeEjemplo = {
  dias: string[];
  sinAbrir: string[];
  ventas: VentaDeEjemplo[];
  /** Ventas de Cheaf y a comercios: no suman a la caja. */
  aMano: VentaAManoDeEjemplo[];
  cierres: CierreDeEjemplo[];
  gastos: GastoDeEjemplo[];
};

const diasHastaAyer = (hoy: string, cantidad: number) =>
  Array.from({ length: cantidad }, (_, i) => sumarDias(hoy, i - cantidad));

// Dos días distintos al azar, sin contar los últimos tres: ayer queda para el aviso.
function diasSinAbrir(azar: Azar, dias: string[]): string[] {
  const elegibles = dias.slice(0, -3);
  const primero = elegibles[entero(azar, 0, elegibles.length - 1)]!;
  const otros = elegibles.filter((d) => d !== primero);
  return [primero, otros[entero(azar, 0, otros.length - 1)]!].sort();
}

function delDia(azar: Azar, dia: string, formas: FormaDeEjemplo[], ultimo: boolean) {
  const ventas = ventasDelDia(azar, dia, formas);
  const cierre = ultimo ? null : cierreDelDia(azar, dia, ventas);
  return { ventas, cierre, aMano: ventasAManoDelDia(azar, dia, formas) };
}

/**
 * Los días hasta ayer: ventas del mostrador y su cierre cada día, salvo dos en que el local no
 * abrió y ayer, que queda sin cierre para que Inicio lo avise. Más los gastos del período.
 */
export function planDeEjemplo(
  semilla: number,
  hoy: string,
  formas: FormaDeEjemplo[],
  cantidadDeDias: number,
): PlanDeEjemplo {
  const azar = crearAzar(semilla);
  const dias = diasHastaAyer(hoy, cantidadDeDias);
  const sinAbrir = diasSinAbrir(azar, dias);
  const abiertos = dias.filter((d) => !sinAbrir.includes(d));
  const diarios = abiertos.map((d) => delDia(azar, d, formas, d === dias.at(-1)));
  const ventas = diarios.flatMap((d) => d.ventas);
  const cierres = diarios.flatMap((d) => (d.cierre ? [d.cierre] : []));
  const aMano = diarios.flatMap((d) => d.aMano);
  return { dias, sinAbrir, ventas, aMano, cierres, gastos: gastosDelPeriodo(azar, dias) };
}

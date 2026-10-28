import type { Medio } from '../caja/resultado';
import { exito, fallo, type Resultado } from '../resultado';

/** Lo que dice la hoja "Medios de pago" del reporte de Fudo para un dia y un medio. */
export type VentasPorMedio = {
  fecha: string;
  medio: Medio;
  totalCentavos: number;
  cantidad: number;
};

export const HOJA_DE_MEDIOS = 'Medios de pago';
const TITULOS = ['Fecha', 'Medio de pago', 'Ventas', 'Cantidad de ventas'];
const MEDIOS_DE_FUDO: Record<string, Medio> = {
  efectivo: 'efectivo',
  qr: 'qr',
  'tarj. crédito': 'credito',
  'tarj. débito': 'debito',
  transferencia: 'transferencia',
};
const MENSAJES = {
  noEsDeFudo: 'Ese archivo no es el reporte de ventas de Fudo. Subí el "Reporte-Ventas".',
  sinVentas: 'El archivo no tiene ventas para cargar.',
  fecha: 'la fecha no se entiende.',
  numeros: 'el monto o la cantidad de ventas no se entiende.',
} as const;
const MS_POR_DIA = 86_400_000;
// El dia 0 de Excel es el 30/12/1899: asi cuenta bien despues de su error del 1900 bisiesto.
const DIA_CERO_DE_EXCEL = Date.UTC(1899, 11, 30);
const SERIE_MINIMA = 36_526; // 1/1/2000
const SERIE_MAXIMA = 73_050; // 31/12/2099

/** El dia de una celda de fecha: Excel la guarda como numero de serie, o como fecha. */
export function fechaDeExcel(valor: unknown): string | undefined {
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? undefined : isoDe(valor);
  if (typeof valor !== 'number' || !Number.isInteger(valor)) return undefined;
  if (valor < SERIE_MINIMA || valor > SERIE_MAXIMA) return undefined;
  return isoDe(new Date(DIA_CERO_DE_EXCEL + valor * MS_POR_DIA));
}

const isoDe = (fecha: Date) => fecha.toISOString().slice(0, 10);

export function medioDeFudo(nombre: string): Medio | undefined {
  return MEDIOS_DE_FUDO[nombre.trim().toLowerCase()];
}

/** El total en partes iguales, una por venta; el resto de la division va en la primera. */
export function repartirEnVentas(totalCentavos: number, cantidad: number): number[] {
  const parte = Math.floor(totalCentavos / cantidad);
  const resto = totalCentavos - parte * cantidad;
  return Array.from({ length: cantidad }, (_, i) => (i === 0 ? parte + resto : parte));
}

const vacia = (fila: unknown[]) => fila.every((c) => c === null || c === undefined || c === '');

const esLaHojaDeFudo = (titulos: unknown[] = []) => TITULOS.every((t, i) => titulos[i] === t);

type Linea = Omit<VentasPorMedio, 'medio'> & { medio: Medio };

function leerFila(fila: unknown[], numero: number): Resultado<Linea> {
  const [celdaFecha, celdaMedio, celdaMonto, celdaCantidad] = fila;
  const fecha = fechaDeExcel(celdaFecha);
  if (!fecha) return fallo(`Fila ${numero}: ${MENSAJES.fecha}`);
  const medio = medioDeFudo(String(celdaMedio ?? ''));
  if (!medio) return fallo(`Fila ${numero}: no conocemos el medio de pago "${celdaMedio}".`);
  const monto = Number(celdaMonto);
  const cantidad = Number(celdaCantidad);
  if (!Number.isFinite(monto) || monto < 0) return fallo(`Fila ${numero}: ${MENSAJES.numeros}`);
  if (!Number.isInteger(cantidad) || cantidad < 1) {
    return fallo(`Fila ${numero}: ${MENSAJES.numeros}`);
  }
  return exito({ fecha, medio, totalCentavos: Math.round(monto * 100), cantidad });
}

function juntar(lineas: Linea[]): VentasPorMedio[] {
  const porClave = new Map<string, VentasPorMedio>();
  for (const l of lineas) {
    const previa = porClave.get(`${l.fecha}|${l.medio}`);
    if (!previa) porClave.set(`${l.fecha}|${l.medio}`, { ...l });
    else {
      previa.totalCentavos += l.totalCentavos;
      previa.cantidad += l.cantidad;
    }
  }
  return [...porClave.values()];
}

/** Lee las filas de la hoja "Medios de pago": un dia y un medio por fila. */
export function leerMediosDePago(filas: unknown[][]): Resultado<VentasPorMedio[]> {
  if (!esLaHojaDeFudo(filas[0])) return fallo(MENSAJES.noEsDeFudo);
  const lineas: Linea[] = [];
  for (const [i, fila] of filas.slice(1).entries()) {
    if (vacia(fila)) continue;
    const lectura = leerFila(fila, i + 2);
    if (!lectura.ok) return lectura;
    lineas.push(lectura.datos);
  }
  return lineas.length === 0 ? fallo(MENSAJES.sinVentas) : exito(juntar(lineas));
}

/** Lo que recibe la funcion de la base: por cada dia y medio, el monto de cada venta. */
export function lotesParaLaBase(ventas: VentasPorMedio[]) {
  return ventas.map((v) => ({
    fecha: v.fecha,
    medio: v.medio,
    montos: repartirEnVentas(v.totalCentavos, v.cantidad),
  }));
}

/** Lo que se muestra antes de guardar: cuanto entra y de que dias. */
export function resumenDeLaSubida(ventas: VentasPorMedio[]) {
  const fechas = ventas.map((v) => v.fecha).sort();
  return {
    desde: fechas[0]!,
    hasta: fechas.at(-1)!,
    dias: new Set(fechas).size,
    ventas: ventas.reduce((suma, v) => suma + v.cantidad, 0),
    totalCentavos: ventas.reduce((suma, v) => suma + v.totalCentavos, 0),
  };
}

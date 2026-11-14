import { sumarMeses } from '../gastos/vencimientos';
import type { Periodo } from '../reportes/periodos';
import { SIN_DETALLE, SIN_VINCULAR, type ProductoDelReporte } from '../reportes/ventas';
import { cantidadParaMostrar } from '../ventas/renglones';

const primeroDelMes = (fecha: string) => `${fecha.slice(0, 8)}01`;

export const mesEnCurso = (hoy: string): Periodo => ({ desde: primeroDelMes(hoy), hasta: hoy });

/** El año y el mes de hoy: el gráfico lo marca "en curso", porque todavía no terminó. */
export const mesDeHoy = (hoy: string) => hoy.slice(0, 7);

/** El grafico mes a mes: este mes y los 11 anteriores. */
export const ultimosDoceMeses = (hoy: string): Periodo => ({
  desde: sumarMeses(primeroDelMes(hoy), -11),
  hasta: hoy,
});

/** El grafico arranca con los ultimos 4 meses; ampliado, muestra todo el año. */
export const mesesVisibles = <T>(meses: T[], ampliado: boolean): T[] =>
  ampliado ? meses : meses.slice(-4);

/** Los 5 que mas plata dejaron; lo no vinculado y lo sin detalle no son productos y no entran. */
export const masVendidos = (productos: ProductoDelReporte[]) =>
  productos.filter((p) => p.clave !== SIN_VINCULAR && p.clave !== SIN_DETALLE).slice(0, 5);

export const textoDePresentaciones = (producto: ProductoDelReporte) =>
  producto.presentaciones.map((p) => `${cantidadParaMostrar(p.cantidad)} ${p.nombre}`).join(' · ');

import { sumarMeses } from '../gastos/vencimientos';
import type { Periodo } from '../reportes/periodos';
import { SIN_VINCULAR, type ProductoDelReporte } from '../reportes/ventas';
import { cantidadParaMostrar } from '../ventas/renglones';

const primeroDelMes = (fecha: string) => `${fecha.slice(0, 8)}01`;

export const mesEnCurso = (hoy: string): Periodo => ({ desde: primeroDelMes(hoy), hasta: hoy });

/** El grafico mes a mes: este mes y los 11 anteriores. */
export const ultimosDoceMeses = (hoy: string): Periodo => ({
  desde: sumarMeses(primeroDelMes(hoy), -11),
  hasta: hoy,
});

/** El grafico arranca con los ultimos 4 meses; ampliado, muestra todo el año. */
export const mesesVisibles = <T>(meses: T[], ampliado: boolean): T[] =>
  ampliado ? meses : meses.slice(-4);

/** Los 5 que mas plata dejaron; lo no vinculado no es un producto y no entra. */
export const masVendidos = (productos: ProductoDelReporte[]) =>
  productos.filter((p) => p.clave !== SIN_VINCULAR).slice(0, 5);

export const textoDePresentaciones = (producto: ProductoDelReporte) =>
  producto.presentaciones.map((p) => `${cantidadParaMostrar(p.cantidad)} ${p.nombre}`).join(' · ');

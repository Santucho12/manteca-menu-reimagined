import { diferenciaConocida, type FilaConVentas } from '../caja/resultadoDeFila';
import type { Cliente } from '../supabase/cliente';
import type { CierreDelReporte } from './caja';
import type { GastoDelDia } from './gastos';
import type { Periodo } from './periodos';
import { resultadoDelPeriodo } from './resultado';
import type { RenglonDeProducto, SinDetalle, VentaDeCategoria, VentaDelDia } from './ventas';

type Respuesta = { data: unknown; error: { message: string } | null };

function leido<T>(respuesta: Respuesta): T[] {
  if (respuesta.error) throw new Error(`No pudimos leer el reporte: ${respuesta.error.message}`);
  return (respuesta.data ?? []) as T[];
}

const POR_TANDA = 1000;

/**
 * Supabase devuelve como mucho 1000 filas por respuesta y corta el resto sin avisar: se pide
 * de a tandas hasta que una venga incompleta. Cada consulta ordena de forma unica, para que
 * las tandas no se pisen.
 */
async function todas<T>(pedir: (desde: number, hasta: number) => PromiseLike<Respuesta>) {
  const filas: T[] = [];
  for (let desde = 0; ; desde += POR_TANDA) {
    const tanda = leido<T>(await pedir(desde, desde + POR_TANDA - 1));
    filas.push(...tanda);
    if (tanda.length < POR_TANDA) return filas;
  }
}

type Reporte =
  | 'reporte_ventas_por_dia'
  | 'reporte_ventas_por_producto'
  | 'reporte_ventas_por_categoria'
  | 'reporte_gastos';

const reporte = <T>(cliente: Cliente, funcion: Reporte, p: Periodo) =>
  todas<T>((desde, hasta) => cliente.rpc(funcion, p).range(desde, hasta));

export const ventasPorDia = (cliente: Cliente, p: Periodo) =>
  reporte<VentaDelDia>(cliente, 'reporte_ventas_por_dia', p);
export const ventasPorProducto = (cliente: Cliente, p: Periodo) =>
  reporte<RenglonDeProducto>(cliente, 'reporte_ventas_por_producto', p);
export const ventasPorCategoria = (cliente: Cliente, p: Periodo) =>
  reporte<VentaDeCategoria>(cliente, 'reporte_ventas_por_categoria', p);
/** Lo vendido sin renglones (el Excel de Fudo no trae productos), para cerrar con el total. */
export async function ventasSinDetalle(cliente: Cliente, p: Periodo): Promise<SinDetalle> {
  const filas = leido<SinDetalle>(await cliente.rpc('reporte_ventas_sin_detalle', p));
  return filas[0] ?? { ventas: 0, monto_centavos: 0 };
}
export const gastosPorDia = (cliente: Cliente, p: Periodo) =>
  reporte<GastoDelDia>(cliente, 'reporte_gastos', p);

type CierreLeido = FilaConVentas & { fecha: string; anulado: boolean; persona_nombre: string };

function aCierre(c: CierreLeido): CierreDelReporte {
  const declaradoCentavos =
    c.efectivo_centavos +
    c.credito_centavos +
    c.debito_centavos +
    c.qr_centavos +
    c.transferencia_centavos;
  return {
    fecha: c.fecha,
    persona: c.persona_nombre,
    declaradoCentavos,
    // Un cierre que espera las ventas no tiene diferencia todavia: no suma por empleado.
    diferenciaCentavos: diferenciaConocida(c),
  };
}

/** Los cierres sin anular del periodo, contra las ventas de cada dia. La base deja leer todos solo al admin. */
export async function cierresDelPeriodo(cliente: Cliente, p: Periodo): Promise<CierreDelReporte[]> {
  const { data, error } = await cliente.rpc('cierres_con_resultado', {
    desde: p.desde,
    hasta: p.hasta,
  });
  if (error) throw new Error(`No pudimos leer los cierres: ${error.message}`);
  return (data as unknown as CierreLeido[]).filter((c) => !c.anulado).map(aCierre);
}

/** Ventas y gastos del periodo con su resultado; vacio si no hay ni una cosa ni la otra. */
export async function datosDelResultado(cliente: Cliente, p: Periodo) {
  const [ventas, gastos] = await Promise.all([ventasPorDia(cliente, p), gastosPorDia(cliente, p)]);
  return {
    ventas,
    gastos,
    resultado: resultadoDelPeriodo(ventas, gastos),
    vacio: ventas.length === 0 && gastos.length === 0,
  };
}

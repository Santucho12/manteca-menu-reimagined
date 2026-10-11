import { diferenciaTotalDe } from '../caja/consultas';
import type { Cliente } from '../supabase/cliente';
import type { CierreDelReporte } from './caja';
import type { GastoDelDia } from './gastos';
import type { Periodo } from './periodos';
import { resultadoDelPeriodo } from './resultado';
import type { RenglonDeProducto, VentaDeCategoria, VentaDelDia } from './ventas';

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
export const gastosPorDia = (cliente: Cliente, p: Periodo) =>
  reporte<GastoDelDia>(cliente, 'reporte_gastos', p);

const COLUMNAS_DE_CIERRE =
  'fecha, efectivo_centavos, credito_centavos, debito_centavos, qr_centavos, ' +
  'transferencia_centavos, fondo_inicial_centavos, queda_en_caja_centavos, ' +
  'esperado_efectivo_centavos, esperado_credito_centavos, esperado_debito_centavos, ' +
  'esperado_qr_centavos, esperado_transferencia_centavos, ' +
  'persona:perfiles!cierres_de_caja_cargado_por_fkey(nombre)';

type CierreLeido = Parameters<typeof diferenciaTotalDe>[0] & {
  fecha: string;
  persona: { nombre: string } | null;
};

function aCierre(c: CierreLeido): CierreDelReporte {
  const declaradoCentavos =
    c.efectivo_centavos +
    c.credito_centavos +
    c.debito_centavos +
    c.qr_centavos +
    c.transferencia_centavos;
  return {
    fecha: c.fecha,
    persona: c.persona?.nombre ?? '',
    declaradoCentavos,
    diferenciaCentavos: diferenciaTotalDe(c),
  };
}

/** Los cierres sin anular del periodo. RLS deja leer todos solo al admin. */
export async function cierresDelPeriodo(cliente: Cliente, p: Periodo): Promise<CierreDelReporte[]> {
  // Hay un solo cierre sin anular por dia: ordenar por fecha ya es un orden unico.
  const cierres = await todas<CierreLeido>((desde, hasta) =>
    cliente
      .from('cierres_de_caja')
      .select(COLUMNAS_DE_CIERRE)
      .eq('anulado', false)
      .gte('fecha', p.desde)
      .lte('fecha', p.hasta)
      .order('fecha', { ascending: false })
      .range(desde, hasta),
  );
  return cierres.map(aCierre);
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

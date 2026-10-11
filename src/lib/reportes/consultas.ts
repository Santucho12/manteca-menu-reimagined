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

export const ventasPorDia = async (cliente: Cliente, p: Periodo) =>
  leido<VentaDelDia>(await cliente.rpc('reporte_ventas_por_dia', p));
export const ventasPorProducto = async (cliente: Cliente, p: Periodo) =>
  leido<RenglonDeProducto>(await cliente.rpc('reporte_ventas_por_producto', p));
export const ventasPorCategoria = async (cliente: Cliente, p: Periodo) =>
  leido<VentaDeCategoria>(await cliente.rpc('reporte_ventas_por_categoria', p));
export const gastosPorDia = async (cliente: Cliente, p: Periodo) =>
  leido<GastoDelDia>(await cliente.rpc('reporte_gastos', p));

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
  const respuesta = await cliente
    .from('cierres_de_caja')
    .select(COLUMNAS_DE_CIERRE)
    .eq('anulado', false)
    .gte('fecha', p.desde)
    .lte('fecha', p.hasta)
    .order('fecha', { ascending: false });
  return leido<CierreLeido>(respuesta).map(aCierre);
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

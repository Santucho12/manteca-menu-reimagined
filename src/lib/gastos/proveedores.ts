import type { Cliente } from '../supabase/cliente';
import { mesDe } from './pantalla';

const anioDe = (hoy: string) => ({
  desde: `${hoy.slice(0, 4)}-01-01`,
  hasta: `${hoy.slice(0, 4)}-12-31`,
});

async function total(
  cliente: Cliente,
  proveedorId: string,
  rango: { desde: string; hasta: string },
) {
  const { data, error } = await cliente.rpc('gastos_total', {
    ...rango,
    el_proveedor: proveedorId,
  });
  if (error) throw new Error(`No pudimos sumar lo pagado: ${error.message}`);
  return data;
}

/** Lo pagado a un proveedor en el mes y en el año de hoy, sin anulados. */
export async function totalesDelProveedor(cliente: Cliente, proveedorId: string, hoy: string) {
  const [mesCentavos, anioCentavos] = await Promise.all([
    total(cliente, proveedorId, mesDe(hoy)),
    total(cliente, proveedorId, anioDe(hoy)),
  ]);
  return { mesCentavos, anioCentavos };
}

/** Lo pagado a cada proveedor en el mes de hoy, para la lista. */
export async function pagadoPorProveedor(
  cliente: Cliente,
  hoy: string,
): Promise<Map<string, number>> {
  const { data, error } = await cliente.rpc('gastos_pagado_por_proveedor', mesDe(hoy));
  if (error) throw new Error(`No pudimos sumar lo pagado: ${error.message}`);
  return new Map(data.map((fila) => [fila.proveedor_id, fila.total_centavos]));
}

/** Cuantos recurrentes activos lo usan: se avisa antes de desactivarlo. */
export async function recurrentesActivosDelProveedor(cliente: Cliente, proveedorId: string) {
  const { count, error } = await cliente
    .from('gastos_recurrentes')
    .select('id', { count: 'exact', head: true })
    .eq('proveedor_id', proveedorId)
    .eq('activo', true);
  if (error) throw new Error(`No pudimos revisar los recurrentes: ${error.message}`);
  return count ?? 0;
}

type FilaPorPagar = {
  proveedor_id: string | null;
  monto_centavos: number;
  gastos: { anulado: boolean }[];
};

// Con un pago vigente ya no se debe; si el pago se anuló, vuelve a deberse.
function sumarPendientes(filas: FilaPorPagar[]): Map<string, number> {
  const totales = new Map<string, number>();
  for (const fila of filas) {
    if (!fila.proveedor_id || fila.gastos.some((g) => !g.anulado)) continue;
    totales.set(fila.proveedor_id, (totales.get(fila.proveedor_id) ?? 0) + fila.monto_centavos);
  }
  return totales;
}

/** Lo por pagar de cada proveedor: lo anotado, sin anular y sin un pago vigente. */
export async function porPagarPorProveedor(cliente: Cliente): Promise<Map<string, number>> {
  const { data, error } = await cliente
    .from('gastos_por_pagar')
    .select('proveedor_id, monto_centavos, gastos(anulado)')
    .eq('anulado', false)
    .not('proveedor_id', 'is', null);
  if (error) throw new Error(`No pudimos sumar lo por pagar: ${error.message}`);
  return sumarPendientes(data);
}

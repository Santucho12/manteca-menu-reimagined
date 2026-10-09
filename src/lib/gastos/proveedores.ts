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

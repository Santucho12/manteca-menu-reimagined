import type { Cliente } from '../supabase/cliente';

export type RenglonDelInsumo = {
  cantidad: number;
  precio_unitario_centavos: number;
  fecha_creacion: string;
  formas_de_compra: { como_se_compra: string } | null;
  compras: { id: string; fecha: string; proveedores: { nombre: string } | null } | null;
};
export type CompraDelInsumo = {
  compraId: string;
  fecha: string;
  proveedor: string;
  comoSeCompra: string;
  cantidad: number;
  precioCentavos: number;
};

const ULTIMAS = 10;
const COLUMNAS =
  'cantidad, precio_unitario_centavos, fecha_creacion, formas_de_compra!inner(como_se_compra, insumo_id), compras!inner(id, fecha, estado, anulado, proveedores(nombre))';

const posterior = (a: RenglonDelInsumo, b: RenglonDelInsumo) =>
  b.compras!.fecha.localeCompare(a.compras!.fecha) ||
  b.fecha_creacion.localeCompare(a.fecha_creacion);

/** Las ultimas compras que trajeron el insumo, de la mas nueva a la mas vieja. */
export function comprasDeRenglones(filas: RenglonDelInsumo[]): CompraDelInsumo[] {
  return filas
    .filter((r) => r.compras)
    .sort(posterior)
    .slice(0, ULTIMAS)
    .map((r) => ({
      compraId: r.compras!.id,
      fecha: r.compras!.fecha,
      proveedor: r.compras!.proveedores?.nombre ?? '',
      comoSeCompra: r.formas_de_compra?.como_se_compra ?? '',
      cantidad: r.cantidad,
      precioCentavos: r.precio_unitario_centavos,
    }));
}

/** Lo que trajo el insumo en compras recibidas y no anuladas. */
export async function comprasDelInsumo(
  cliente: Cliente,
  insumoId: string,
): Promise<CompraDelInsumo[]> {
  const { data, error } = await cliente
    .from('renglones_de_compra')
    .select(COLUMNAS)
    .eq('formas_de_compra.insumo_id', insumoId)
    .eq('compras.estado', 'recibida')
    .eq('compras.anulado', false)
    .gt('cantidad', 0)
    .order('fecha_creacion', { ascending: false })
    .limit(100);
  if (error) throw new Error(`No pudimos leer las compras del insumo: ${error.message}`);
  return comprasDeRenglones(data as unknown as RenglonDelInsumo[]);
}

import type { Cliente } from '../supabase/cliente';

type Unidad = 'g' | 'ml' | 'unidad';
export type FormaParaComprar = {
  id: string;
  proveedorId: string | null;
  insumo: string;
  unidad: Unidad;
  comoSeCompra: string;
  contenido: number;
  ultimoPrecioCentavos: number | null;
  referenciaCentavos: number | null;
};
export type UltimoPrecio = { precioCentavos: number; fecha: string };

type Pagado = {
  forma_de_compra_id: string;
  precio_unitario_centavos: number;
  compras: { fecha: string };
};
type FormaDeLaBase = {
  id: string;
  proveedor_id: string | null;
  como_se_compra: string;
  contenido: number;
  precio_referencia_centavos: number | null;
  insumos: { nombre: string; unidad_de_uso: Unidad; activo: boolean } | null;
};

const COLUMNAS_DE_FORMA =
  'id, proveedor_id, como_se_compra, contenido, precio_referencia_centavos, insumos(nombre, unidad_de_uso, activo)';

/** Por forma, el precio de la compra mas reciente. */
function masRecientes(filas: Pagado[]): Map<string, UltimoPrecio> {
  const porForma = new Map<string, UltimoPrecio>();
  for (const r of filas) {
    const ya = porForma.get(r.forma_de_compra_id);
    if (!ya || r.compras.fecha > ya.fecha) {
      const precio = { precioCentavos: r.precio_unitario_centavos, fecha: r.compras.fecha };
      porForma.set(r.forma_de_compra_id, precio);
    }
  }
  return porForma;
}

/** El ultimo precio pagado por cada forma de compra, de compras recibidas y no anuladas. */
export async function ultimosPrecios(cliente: Cliente): Promise<Map<string, UltimoPrecio>> {
  const { data, error } = await cliente
    .from('renglones_de_compra')
    .select('forma_de_compra_id, precio_unitario_centavos, compras!inner(fecha, estado, anulado)')
    .gt('precio_unitario_centavos', 0)
    .eq('compras.estado', 'recibida')
    .eq('compras.anulado', false)
    .order('fecha_creacion', { ascending: false })
    .limit(2000);
  if (error) throw new Error(`No pudimos leer los precios pagados: ${error.message}`);
  return masRecientes(data as unknown as Pagado[]);
}

function formaDe(f: FormaDeLaBase, precios: Map<string, UltimoPrecio>): FormaParaComprar {
  return {
    id: f.id,
    proveedorId: f.proveedor_id,
    insumo: f.insumos!.nombre,
    unidad: f.insumos!.unidad_de_uso,
    comoSeCompra: f.como_se_compra,
    contenido: f.contenido,
    ultimoPrecioCentavos: precios.get(f.id)?.precioCentavos ?? null,
    referenciaCentavos: f.precio_referencia_centavos,
  };
}

/** Las formas de compra activas, con su ultimo precio, para cargar una compra o un pedido. */
export async function formasParaComprar(cliente: Cliente): Promise<FormaParaComprar[]> {
  const [respuesta, precios] = await Promise.all([
    cliente.from('formas_de_compra').select(COLUMNAS_DE_FORMA).eq('activo', true),
    ultimosPrecios(cliente),
  ]);
  if (respuesta.error) {
    throw new Error(`No pudimos leer las formas de compra: ${respuesta.error.message}`);
  }
  return (respuesta.data as unknown as FormaDeLaBase[])
    .filter((f) => f.insumos?.activo)
    .map((f) => formaDe(f, precios))
    .sort((a, b) => a.insumo.localeCompare(b.insumo, 'es'));
}

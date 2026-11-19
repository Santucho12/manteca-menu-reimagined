import type { Cliente } from '../supabase/cliente';
import type { FiltrosDeCompras } from './pantalla';

export {
  formasParaComprar,
  ultimosPrecios,
  type FormaParaComprar,
  type UltimoPrecio,
} from './formas';

export type FilaDeCompra = {
  id: string;
  estado: 'pedida' | 'recibida';
  anulado: boolean;
  fecha: string | null;
  total_centavos: number;
  proveedor: string;
  renglones: number;
  pagada: boolean;
  vencimiento: string | null;
};
export type RenglonDeLaCompra = {
  formaId: string;
  insumo: string;
  comoSeCompra: string;
  cantidadPedida: number | null;
  cantidad: number;
  precioCentavos: number;
  subtotalCentavos: number;
};
export type Compra = FilaDeCompra & {
  proveedorId: string;
  telefono: string | null;
  factura: string | null;
  otrosCargosCentavos: number;
  gastoId: string | null;
  motivoAnulacion: string | null;
  renglonesDeLaCompra: RenglonDeLaCompra[];
};

type CompraDeLaBase = {
  id: string;
  estado: 'pedida' | 'recibida';
  anulado: boolean;
  fecha: string | null;
  total_centavos: number;
  gasto_id: string | null;
  proveedores: { nombre: string } | null;
  renglones_de_compra: { count: number }[];
  gastos_por_pagar: { vencimiento: string } | null;
};
type DetalleDeLaBase = {
  forma_de_compra_id: string;
  cantidad_pedida: number | null;
  cantidad: number;
  precio_unitario_centavos: number;
  subtotal_centavos: number;
  formas_de_compra: { como_se_compra: string; insumos: { nombre: string } | null } | null;
};
type CompraEnteraDeLaBase = CompraDeLaBase & {
  proveedor_id: string;
  factura: string | null;
  otros_cargos_centavos: number;
  motivo_anulacion: string | null;
  proveedor: { telefono: string | null } | null;
  detalle: DetalleDeLaBase[];
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLUMNAS_DE_LISTA =
  'id, estado, anulado, fecha, total_centavos, gasto_id, proveedores(nombre), renglones_de_compra(count), gastos_por_pagar!compras_por_pagar_id_fkey(vencimiento)';
const COLUMNAS_DE_LA_COMPRA = `${COLUMNAS_DE_LISTA}, proveedor_id, factura, otros_cargos_centavos, motivo_anulacion, proveedor:proveedores(telefono), detalle:renglones_de_compra(forma_de_compra_id, cantidad_pedida, cantidad, precio_unitario_centavos, subtotal_centavos, formas_de_compra(como_se_compra, insumos(nombre)))`;

function filaDe(c: CompraDeLaBase): FilaDeCompra {
  return {
    id: c.id,
    estado: c.estado,
    anulado: c.anulado,
    fecha: c.fecha,
    total_centavos: c.total_centavos,
    proveedor: c.proveedores?.nombre ?? '',
    renglones: c.renglones_de_compra[0]?.count ?? 0,
    pagada: c.gasto_id !== null,
    vencimiento: c.gastos_por_pagar?.vencimiento ?? null,
  };
}

type Filtrable<T> = { eq(columna: string, valor: unknown): T };

function filtrar<T extends Filtrable<T>>(consulta: T, { estado, proveedor }: FiltrosDeCompras): T {
  const delProveedor = proveedor && UUID.test(proveedor);
  const porProveedor = delProveedor ? consulta.eq('proveedor_id', proveedor) : consulta;
  if (estado === 'anulada') return porProveedor.eq('anulado', true);
  if (estado === 'todas') return porProveedor;
  return porProveedor.eq('anulado', false).eq('estado', estado);
}

/** Las compras del local, con los pedidos sin recibir arriba. Solo las lee el admin activo. */
export async function listarCompras(
  cliente: Cliente,
  filtros: FiltrosDeCompras,
): Promise<FilaDeCompra[]> {
  const consulta = cliente.from('compras').select(COLUMNAS_DE_LISTA);
  const { data, error } = await filtrar(consulta, filtros)
    .order('estado')
    .order('fecha', { ascending: false, nullsFirst: true })
    .order('fecha_creacion', { ascending: false })
    .limit(100);
  if (error) throw new Error(`No pudimos leer las compras: ${error.message}`);
  return (data as unknown as CompraDeLaBase[]).map(filaDe);
}

const renglonDe = (r: DetalleDeLaBase): RenglonDeLaCompra => ({
  formaId: r.forma_de_compra_id,
  insumo: r.formas_de_compra?.insumos?.nombre ?? '',
  comoSeCompra: r.formas_de_compra?.como_se_compra ?? '',
  cantidadPedida: r.cantidad_pedida,
  cantidad: r.cantidad,
  precioCentavos: r.precio_unitario_centavos,
  subtotalCentavos: r.subtotal_centavos,
});

function compraDe(c: CompraEnteraDeLaBase): Compra {
  return {
    ...filaDe(c),
    proveedorId: c.proveedor_id,
    telefono: c.proveedor?.telefono ?? null,
    factura: c.factura,
    otrosCargosCentavos: c.otros_cargos_centavos,
    gastoId: c.gasto_id,
    motivoAnulacion: c.motivo_anulacion,
    renglonesDeLaCompra: c.detalle.map(renglonDe),
  };
}

/** Una compra con sus renglones. Un id mal escrito no es un error: no hay compra. */
export async function compraPorId(cliente: Cliente, id: string): Promise<Compra | null> {
  if (!UUID.test(id)) return null;
  const { data, error } = await cliente
    .from('compras')
    .select(COLUMNAS_DE_LA_COMPRA)
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`No pudimos leer la compra: ${error.message}`);
  return data ? compraDe(data as unknown as CompraEnteraDeLaBase) : null;
}

/** Las ultimas compras de un proveedor, para su ficha. */
export async function comprasDelProveedor(cliente: Cliente, proveedorId: string) {
  const todas = await listarCompras(cliente, { estado: 'todas', proveedor: proveedorId });
  return todas.slice(0, 10);
}

export type GastoParaCompra = {
  id: string;
  fecha: string;
  montoCentavos: number;
  descripcion: string | null;
};

type GastoDeLaBase = {
  id: string;
  fecha: string;
  monto_centavos: number;
  descripcion: string | null;
  cierre_id: string | null;
  compra_id: string | null;
  anulado: boolean;
  categorias_de_gasto: { de_sistema: boolean } | null;
};

const COLUMNAS_DEL_GASTO =
  'id, fecha, monto_centavos, descripcion, cierre_id, compra_id, anulado, categorias_de_gasto(de_sistema)';

const estaParaClasificar = (g: GastoDeLaBase) =>
  Boolean(g.cierre_id && !g.compra_id && !g.anulado && g.categorias_de_gasto?.de_sistema);

/** El gasto de caja sin clasificar sobre el que se arma una compra; si ya no lo esta, nada. */
export async function gastoParaCompra(
  cliente: Cliente,
  id: string,
): Promise<GastoParaCompra | null> {
  if (!UUID.test(id)) return null;
  const { data, error } = await cliente
    .from('gastos')
    .select(COLUMNAS_DEL_GASTO)
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`No pudimos leer el gasto: ${error.message}`);
  const gasto = data as GastoDeLaBase | null;
  if (!gasto || !estaParaClasificar(gasto)) return null;
  return {
    id: gasto.id,
    fecha: gasto.fecha,
    montoCentavos: gasto.monto_centavos,
    descripcion: gasto.descripcion,
  };
}

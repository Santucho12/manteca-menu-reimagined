import { escapado, patronDe } from '../proveedores/consultas';
import type { Cliente } from '../supabase/cliente';
import { POR_PAGINA, cantidadDePaginas } from '../usuarios/presentacion';
import type { OrigenDelCosto, UnidadDeUso } from './costo';

export type FiltrosDeInsumos = { busqueda: string | null; desactivados: boolean; pagina: number };
export type CostoDeInsumo = {
  costo_por_unidad: number | null;
  origen: OrigenDelCosto;
  fecha_origen: string | null;
};
export type FilaDeInsumo = CostoDeInsumo & {
  id: string;
  nombre: string;
  unidad_de_uso: UnidadDeUso;
  activo: boolean;
};
export type FormaDeCompra = {
  id: string;
  proveedor_id: string | null;
  proveedor: string | null;
  como_se_compra: string;
  contenido: number;
  precio_referencia_centavos: number | null;
  activo: boolean;
};
export type Insumo = FilaDeInsumo & { observaciones: string | null; formas: FormaDeCompra[] };
export type ListaDeInsumos = { filas: FilaDeInsumo[]; total: number; pagina: number };

const SIN_COSTO: CostoDeInsumo = { costo_por_unidad: null, origen: null, fecha_origen: null };
const COLUMNAS = 'id, nombre, unidad_de_uso, activo';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Filtrable<T> = { eq(columna: string, valor: boolean): T; ilike(c: string, p: string): T };

function filtrar<T extends Filtrable<T>>(consulta: T, filtros: FiltrosDeInsumos): T {
  const porEstado = consulta.eq('activo', !filtros.desactivados);
  return filtros.busqueda ? porEstado.ilike('nombre', patronDe(filtros.busqueda)) : porEstado;
}

/** El costo de hoy de estos insumos, que calcula la base, por id. */
async function costosDe(cliente: Cliente, ids: string[]): Promise<Map<string, CostoDeInsumo>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await cliente.rpc('costo_de_insumos').in('insumo_id', ids);
  if (error) throw new Error(`No pudimos calcular el costo de los insumos: ${error.message}`);
  return new Map(
    data.map((fila) => [fila.insumo_id, { ...fila, origen: fila.origen as OrigenDelCosto }]),
  );
}

async function conCosto<T extends { id: string }>(cliente: Cliente, filas: T[]) {
  const costos = await costosDe(
    cliente,
    filas.map((fila) => fila.id),
  );
  return filas.map((fila) => {
    const { costo_por_unidad, origen, fecha_origen } = costos.get(fila.id) ?? SIN_COSTO;
    return { ...fila, costo_por_unidad, origen, fecha_origen };
  });
}

async function contar(cliente: Cliente, filtros: FiltrosDeInsumos): Promise<number> {
  const consulta = cliente.from('insumos').select('id', { count: 'exact', head: true });
  const { count, error } = await filtrar(consulta, filtros);
  if (error) throw new Error(`No pudimos contar los insumos: ${error.message}`);
  return count ?? 0;
}

/** Una pagina de insumos del local, por nombre, con su costo. Solo los lee el admin activo. */
export async function listarInsumos(
  cliente: Cliente,
  filtros: FiltrosDeInsumos,
): Promise<ListaDeInsumos> {
  const total = await contar(cliente, filtros);
  const pagina = Math.min(filtros.pagina, cantidadDePaginas(total));
  const desde = (pagina - 1) * POR_PAGINA;
  const { data, error } = await filtrar(cliente.from('insumos').select(COLUMNAS), filtros)
    .order('nombre')
    .order('id')
    .range(desde, desde + POR_PAGINA - 1);
  if (error) throw new Error(`No pudimos leer los insumos: ${error.message}`);
  return { filas: await conCosto(cliente, data), total, pagina };
}

async function formasDe(cliente: Cliente, insumoId: string): Promise<FormaDeCompra[]> {
  const { data, error } = await cliente
    .from('formas_de_compra')
    .select(
      'id, proveedor_id, como_se_compra, contenido, precio_referencia_centavos, activo, proveedores(nombre)',
    )
    .eq('insumo_id', insumoId)
    .order('activo', { ascending: false })
    .order('fecha_creacion');
  if (error) throw new Error(`No pudimos leer las formas de compra: ${error.message}`);
  return data.map(({ proveedores, ...forma }) => ({
    ...forma,
    proveedor: proveedores?.nombre ?? null,
  }));
}

/** La ficha de un insumo. Un id mal escrito no es un error: no hay insumo y la pantalla da 404. */
export async function insumoPorId(cliente: Cliente, id: string): Promise<Insumo | null> {
  if (!UUID.test(id)) return null;
  const { data, error } = await cliente
    .from('insumos')
    .select(`${COLUMNAS}, observaciones`)
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`No pudimos leer el insumo: ${error.message}`);
  if (!data) return null;
  const [conSuCosto] = await conCosto(cliente, [data]);
  return { ...conSuCosto!, formas: await formasDe(cliente, id) };
}

/** El nombre de un insumo del local que se llama igual, sin importar mayusculas. */
export async function nombreDeInsumoRepetido(
  cliente: Cliente,
  nombre: string,
): Promise<string | null> {
  const buscado = nombre.trim().toLowerCase();
  const { data, error } = await cliente
    .from('insumos')
    .select('nombre')
    .ilike('nombre', escapado(nombre.trim()))
    .limit(20);
  if (error) throw new Error(`No pudimos revisar el nombre: ${error.message}`);
  return data.find((fila) => fila.nombre.toLowerCase() === buscado)?.nombre ?? null;
}

export type ProveedorParaElegir = { id: string; nombre: string };

/** Los proveedores activos para elegir en una forma de compra, y el que ya tenia al editarla. */
export async function proveedoresParaElegir(
  cliente: Cliente,
  actual: string | null,
): Promise<ProveedorParaElegir[]> {
  const filtro = actual && UUID.test(actual) ? `activo.eq.true,id.eq.${actual}` : 'activo.eq.true';
  const { data, error } = await cliente
    .from('proveedores')
    .select('id, nombre')
    .or(filtro)
    .order('nombre')
    .limit(1000);
  if (error) throw new Error(`No pudimos leer los proveedores: ${error.message}`);
  return data;
}

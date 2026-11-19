import type { Cliente } from '../supabase/cliente';
import { comprobar, listarCostos, type ProductoConCosto } from './consultas';

type Unidad = 'g' | 'ml' | 'unidad';
export type RenglonDeReceta = {
  insumoId: string;
  nombre: string;
  unidad: Unidad;
  cantidad: number;
  costoPorUnidad: number | null;
  aporte: number | null;
  activoElInsumo: boolean;
};
export type Receta = {
  id: string;
  rinde: number;
  desperdicio: number;
  renglones: RenglonDeReceta[];
};
export type RecetaDelProducto = {
  producto: ProductoConCosto;
  base: Receta | null;
  presentaciones: { id: string; nombre: string; propia: Receta | null }[];
};

type Costos = Map<string, number | null>;
type Insumo = { id: string; nombre: string; unidad_de_uso: Unidad; activo: boolean };
type FilaDeReceta = {
  id: string;
  presentacion_id: string | null;
  rinde: number;
  desperdicio_porcentaje: number;
  renglones_de_receta: { cantidad: number; activo: boolean; insumos: Insumo | null }[];
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLUMNAS =
  'id, presentacion_id, rinde, desperdicio_porcentaje, renglones_de_receta(cantidad, activo, insumos(id, nombre, unidad_de_uso, activo))';

function renglonDe(
  cantidad: number,
  insumo: Insumo,
  costos: Map<string, number | null>,
): RenglonDeReceta {
  const costoPorUnidad = costos.get(insumo.id) ?? null;
  return {
    insumoId: insumo.id,
    nombre: insumo.nombre,
    unidad: insumo.unidad_de_uso,
    cantidad,
    costoPorUnidad,
    // Lo que aporta, solo para mostrar: el costo que vale lo redondea la base.
    aporte: costoPorUnidad === null ? null : Math.round(cantidad * costoPorUnidad),
    activoElInsumo: insumo.activo,
  };
}

function armarReceta(fila: FilaDeReceta, costos: Map<string, number | null>): Receta {
  const renglones = fila.renglones_de_receta
    .filter((r) => r.activo && r.insumos)
    .map((r) => renglonDe(r.cantidad, r.insumos!, costos));
  return { id: fila.id, rinde: fila.rinde, desperdicio: fila.desperdicio_porcentaje, renglones };
}

async function recetasDe(cliente: Cliente, productoId: string): Promise<FilaDeReceta[]> {
  const respuesta = await cliente
    .from('recetas')
    .select(COLUMNAS)
    .eq('producto_id', productoId)
    .eq('activo', true);
  return comprobar(respuesta, 'la receta') as FilaDeReceta[];
}

async function costosDeInsumos(cliente: Cliente): Promise<Map<string, number | null>> {
  const filas = comprobar(await cliente.rpc('costo_de_insumos'), 'el costo de los insumos');
  return new Map(filas.map((f) => [f.insumo_id, f.costo_por_unidad]));
}

function armarTodo(producto: ProductoConCosto, recetas: FilaDeReceta[], costos: Costos) {
  const recetaDe = (presentacion: string | null) => {
    const fila = recetas.find((r) => r.presentacion_id === presentacion);
    return fila ? armarReceta(fila, costos) : null;
  };
  const presentaciones = producto.presentaciones.map((p) => ({
    id: p.presentacionId,
    nombre: p.nombre,
    propia: recetaDe(p.presentacionId),
  }));
  return { producto, base: recetaDe(null), presentaciones };
}

/** La receta de un producto, la propia de cada presentacion y su tabla de costos. */
export async function recetaDelProducto(
  cliente: Cliente,
  productoId: string,
): Promise<RecetaDelProducto | null> {
  if (!UUID.test(productoId)) return null;
  const lista = await listarCostos(cliente, { filtro: 'todos', orden: 'nombre' });
  const producto = lista.find((fila) => fila.productoId === productoId);
  if (!producto) return null;
  const [recetas, costos] = await Promise.all([
    recetasDe(cliente, productoId),
    costosDeInsumos(cliente),
  ]);
  return armarTodo(producto, recetas, costos);
}

export type InsumoParaReceta = { id: string; nombre: string; unidad: Unidad };

/** Los insumos activos para elegir en una receta, por nombre. */
export async function insumosParaReceta(cliente: Cliente): Promise<InsumoParaReceta[]> {
  const { data, error } = await cliente
    .from('insumos')
    .select('id, nombre, unidad_de_uso')
    .eq('activo', true)
    .order('nombre')
    .limit(1000);
  if (error) throw new Error(`No pudimos leer los insumos: ${error.message}`);
  return data.map((i) => ({ id: i.id, nombre: i.nombre, unidad: i.unidad_de_uso }));
}

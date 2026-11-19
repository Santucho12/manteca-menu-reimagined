import type { Cliente } from '../supabase/cliente';

export type RenglonConReceta = {
  insumo_id: string;
  recetas: {
    id: string;
    activo: boolean;
    producto_id: string;
    productos: { nombre: string } | null;
    presentaciones: { nombre: string } | null;
  } | null;
};
export type UsoDelInsumo = {
  recetaId: string;
  productoId: string;
  producto: string;
  presentacion: string | null;
};

const COLUMNAS =
  'insumo_id, recetas(id, activo, producto_id, productos(nombre), presentaciones(nombre))';

const enUso = (filas: RenglonConReceta[]) => filas.filter((f) => f.recetas?.activo);

/** En cuantas recetas activas esta cada insumo. */
export function recetasPorInsumo(filas: RenglonConReceta[]): Map<string, number> {
  const recetas = new Map<string, Set<string>>();
  for (const fila of enUso(filas)) {
    const suyas = recetas.get(fila.insumo_id) ?? new Set<string>();
    suyas.add(fila.recetas!.id);
    recetas.set(fila.insumo_id, suyas);
  }
  return new Map([...recetas].map(([insumo, suyas]) => [insumo, suyas.size]));
}

/** Los productos cuya receta lo usa; la presentacion, si es su receta propia. */
export function usosDelInsumo(filas: RenglonConReceta[]): UsoDelInsumo[] {
  return enUso(filas).map((f) => ({
    recetaId: f.recetas!.id,
    productoId: f.recetas!.producto_id,
    producto: f.recetas!.productos?.nombre ?? '',
    presentacion: f.recetas!.presentaciones?.nombre ?? null,
  }));
}

/** Los renglones de receta activos de estos insumos, con su receta y su producto. */
export async function renglonesDeReceta(
  cliente: Cliente,
  insumos: string[],
): Promise<RenglonConReceta[]> {
  if (insumos.length === 0) return [];
  const { data, error } = await cliente
    .from('renglones_de_receta')
    .select(COLUMNAS)
    .eq('activo', true)
    .in('insumo_id', insumos);
  if (error) throw new Error(`No pudimos leer las recetas: ${error.message}`);
  return data as unknown as RenglonConReceta[];
}

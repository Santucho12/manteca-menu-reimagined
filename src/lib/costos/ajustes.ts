import type { Cliente } from '../supabase/cliente';

export type PresentacionParaAjustar = {
  id: string;
  nombre: string;
  unidades: number | null;
  agregadoCentavos: number;
};
export type CategoriaParaAjustar = {
  id: string;
  nombre: string;
  presentaciones: PresentacionParaAjustar[];
};

type Fila = {
  id: string;
  nombre: string;
  orden: number;
  activo: boolean;
  costos_de_presentacion: { unidades: number; agregado_centavos: number } | null;
};

const COLUMNAS =
  'id, nombre, presentaciones(id, nombre, orden, activo, costos_de_presentacion(unidades, agregado_centavos))';

function presentacionesDe(filas: Fila[]): PresentacionParaAjustar[] {
  return filas
    .filter((p) => p.activo)
    .sort((a, b) => a.orden - b.orden)
    .map((p) => ({
      id: p.id,
      nombre: p.nombre,
      unidades: p.costos_de_presentacion?.unidades ?? null,
      agregadoCentavos: p.costos_de_presentacion?.agregado_centavos ?? 0,
    }));
}

/** Por categoria activa, sus presentaciones con las unidades y el agregado cargados. */
export async function presentacionesParaAjustar(cliente: Cliente): Promise<CategoriaParaAjustar[]> {
  const { data, error } = await cliente
    .from('categorias')
    .select(COLUMNAS)
    .eq('activo', true)
    .order('orden');
  if (error) throw new Error(`No pudimos leer las presentaciones: ${error.message}`);
  return data.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    presentaciones: presentacionesDe(c.presentaciones as Fila[]),
  }));
}

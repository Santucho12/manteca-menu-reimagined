import { exito, fallo, type Resultado } from '../resultado';
import type { Cliente } from '../supabase/cliente';
import {
  recetaParaLaBase,
  unidadesParaLaBase,
  type DatosDeMargenes,
  type DatosDeReceta,
  type DatosDeUnidades,
} from './esquemas';

export const MENSAJES_DE_COSTOS: Record<string, string> = {
  '42501': 'No tenés permiso para hacer esto.',
  PK300: 'No tenés permiso para hacer esto.',
  PK301: 'Ese producto, esa presentación o ese insumo ya no están disponibles. Recargá la página.',
  PK302: 'Un insumo está desactivado: reactivalo en Materia prima o sacalo de la receta.',
  PK303: 'Un insumo está dos veces en la receta.',
  PK304: 'Agregá al menos un insumo.',
  PK305: 'Esa presentación ya usa la receta del producto. Recargá la página.',
};
const GENERICO = 'No pudimos guardarlo. Revisá los datos e intentá de nuevo.';

const mensajeDe = (error: { code?: string | null }) =>
  MENSAJES_DE_COSTOS[error.code ?? ''] ?? GENERICO;

/** La receta entera, en una transaccion de la base. */
export async function guardarReceta(cliente: Cliente, datos: DatosDeReceta): Promise<Resultado> {
  const { error } = await cliente.rpc('recetas_guardar', { datos: recetaParaLaBase(datos) });
  return error ? fallo(mensajeDe(error)) : exito(undefined);
}

type Escritura = PromiseLike<{ data: unknown[] | null; error: { code?: string } | null }>;

// Primero se cambia la fila que ya existe; si no habia, se carga. Asi no hace falta permiso
// para reescribir la presentacion ni el local, que es lo que pediria un upsert.
async function cambiarOCargar(
  cambiar: () => Escritura,
  cargar: () => Escritura,
): Promise<Resultado> {
  const cambio = await cambiar();
  if (cambio.error) return fallo(mensajeDe(cambio.error));
  if ((cambio.data ?? []).length > 0) return exito(undefined);
  const carga = await cargar();
  return carga.error ? fallo(mensajeDe(carga.error)) : exito(undefined);
}

export function guardarUnidades(cliente: Cliente, presentacionId: string, datos: DatosDeUnidades) {
  const fila = unidadesParaLaBase(datos);
  const tabla = 'costos_de_presentacion';
  return cambiarOCargar(
    () => cliente.from(tabla).update(fila).eq('presentacion_id', presentacionId).select('id'),
    () =>
      cliente
        .from(tabla)
        .insert({ presentacion_id: presentacionId, ...fila })
        .select('id'),
  );
}

export function guardarMargenes(cliente: Cliente, datos: DatosDeMargenes) {
  const fila = {
    margen_objetivo_porcentaje: datos.objetivo,
    margen_minimo_porcentaje: datos.minimo,
  };
  const tabla = 'configuracion_de_costos';
  // RLS deja ver solo la fila del local de la sesion: el update sin filtro toca solo esa.
  return cambiarOCargar(
    () => cliente.from(tabla).update(fila).not('id', 'is', null).select('id'),
    () => cliente.from(tabla).insert(fila).select('id'),
  );
}

/** La presentacion deja su receta propia y vuelve a usar la del producto. */
export async function usarLaRecetaDelProducto(
  cliente: Cliente,
  productoId: string,
  presentacionId: string,
): Promise<Resultado> {
  const { error } = await cliente.rpc('recetas_usar_la_del_producto', {
    el_producto: productoId,
    la_presentacion: presentacionId,
  });
  return error ? fallo(mensajeDe(error)) : exito(undefined);
}

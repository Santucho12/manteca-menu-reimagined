import { exito, fallo, type Resultado } from '../resultado';
import type { Cliente } from '../supabase/cliente';
import { nombreRepetido } from './consultas';
import { proveedorParaLaBase, type DatosDeProveedor } from './esquemas';

export const MENSAJES_DE_PROVEEDORES = {
  sinPermiso: 'No tenés permiso para hacer esto.',
  noDisponible: 'Ese proveedor ya no está disponible. Recargá la página.',
  generico: 'No pudimos guardarlo. Revisá los datos e intentá de nuevo.',
} as const;

export type Creado = { estado: 'creado'; id: string } | { estado: 'confirmar'; nombre: string };

function mensajeDe(error: { code?: string | null }): string {
  return error.code === '42501'
    ? MENSAJES_DE_PROVEEDORES.sinPermiso
    : MENSAJES_DE_PROVEEDORES.generico;
}

/** Si ya hay uno con ese nombre, pregunta antes: puede ser el mismo cargado dos veces. */
export async function crearProveedor(
  cliente: Cliente,
  datos: DatosDeProveedor,
  confirmar: boolean,
): Promise<Resultado<Creado>> {
  const repetido = confirmar ? null : await nombreRepetido(cliente, datos.nombre);
  if (repetido) return exito({ estado: 'confirmar', nombre: repetido });
  const { data, error } = await cliente
    .from('proveedores')
    .insert(proveedorParaLaBase(datos))
    .select('id')
    .single();
  return error ? fallo(mensajeDe(error)) : exito({ estado: 'creado', id: data.id });
}

// RLS no da error si la fila no es del local: se comprueba que haya cambiado una.
async function cambiar(
  cliente: Cliente,
  id: string,
  cambios: ReturnType<typeof proveedorParaLaBase> | { activo: boolean },
): Promise<Resultado> {
  const { data, error } = await cliente
    .from('proveedores')
    .update(cambios)
    .eq('id', id)
    .select('id');
  if (error) return fallo(mensajeDe(error));
  return data.length === 1 ? exito(undefined) : fallo(MENSAJES_DE_PROVEEDORES.noDisponible);
}

export function editarProveedor(cliente: Cliente, id: string, datos: DatosDeProveedor) {
  return cambiar(cliente, id, proveedorParaLaBase(datos));
}

export function cambiarEstadoDeProveedor(cliente: Cliente, id: string, activo: boolean) {
  return cambiar(cliente, id, { activo });
}

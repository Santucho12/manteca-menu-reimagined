import type { PerfilDeAcceso } from '../acceso/estados';
import type { Cliente } from '../supabase/cliente';
import {
  POR_PAGINA,
  cantidadDePaginas,
  type FilaDeUsuario,
  type FiltroDeEstado,
  type FiltrosDeLista,
} from './presentacion';

export type ListaDeUsuarios = { filas: FilaDeUsuario[]; total: number; pagina: number };

// Cualquier consulta de PostgREST que se pueda filtrar.
type Filtrable<T> = { match(condiciones: Record<string, unknown>): T; or(filtros: string): T };

const COLUMNAS_DEL_PERFIL = 'id, nombre, email, rol, activo, debe_cambiar_contrasena';
const COLUMNAS_DE_LA_LISTA = 'id, nombre, email, rol, activo';

// pendiente es la columna calculada de la base: invitado y activo.
const CONDICIONES_DE_ESTADO: Record<FiltroDeEstado, Record<string, boolean>> = {
  todos: {},
  pendientes: { pendiente: true },
  activos: { activo: true, pendiente: false },
  desactivados: { activo: false },
};

/** El perfil de quien tiene la sesion. Un desactivado tambien lee el suyo: asi se entera. */
export async function perfilPropio(cliente: Cliente): Promise<PerfilDeAcceso | null> {
  const { data: sesion } = await cliente.auth.getClaims();
  const id = sesion?.claims.sub;
  if (!id) return null;
  const { data, error } = await cliente
    .from('perfiles')
    .select(COLUMNAS_DEL_PERFIL)
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`No pudimos leer el perfil: ${error.message}`);
  return data;
}

// En ilike el _ es comodin. Dentro de las comillas de PostgREST, \\ llega a la base como \,
// y \_ busca el guion bajo tal cual.
const sinComodines = (texto: string) => texto.replaceAll('_', '\\\\_');

// Las comillas dejan buscar con espacios; textoDeBusqueda ya saco lo que rompe el filtro.
function filtrar<T extends Filtrable<T>>(consulta: T, { estado, busqueda }: FiltrosDeLista): T {
  const conEstado = consulta.match(CONDICIONES_DE_ESTADO[estado]);
  if (!busqueda) return conEstado;
  const patron = `"%${sinComodines(busqueda)}%"`;
  return conEstado.or(`nombre.ilike.${patron},email.ilike.${patron}`);
}

async function contarUsuarios(cliente: Cliente, filtros: FiltrosDeLista): Promise<number> {
  const consulta = cliente.from('perfiles').select('id', { count: 'exact', head: true });
  const { count, error } = await filtrar(consulta, filtros);
  if (error) throw new Error(`No pudimos contar los usuarios: ${error.message}`);
  return count ?? 0;
}

/** Una pagina de la lista, con los que esperan un rol primero. Una pagina de mas va a la ultima. */
export async function listarUsuarios(
  cliente: Cliente,
  filtros: FiltrosDeLista,
): Promise<ListaDeUsuarios> {
  const total = await contarUsuarios(cliente, filtros);
  const pagina = Math.min(filtros.pagina, cantidadDePaginas(total));
  const desde = (pagina - 1) * POR_PAGINA;
  const consulta = cliente.from('perfiles').select(COLUMNAS_DE_LA_LISTA);
  const { data, error } = await filtrar(consulta, filtros)
    .order('pendiente', { ascending: false })
    .order('nombre')
    .order('id')
    .range(desde, desde + POR_PAGINA - 1);
  if (error) throw new Error(`No pudimos leer los usuarios: ${error.message}`);
  return { filas: data, total, pagina };
}

export function contarPendientes(cliente: Cliente): Promise<number> {
  return contarUsuarios(cliente, { busqueda: null, estado: 'pendientes', pagina: 1 });
}

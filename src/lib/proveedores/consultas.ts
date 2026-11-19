import type { Cliente } from '../supabase/cliente';
import { POR_PAGINA, cantidadDePaginas } from '../usuarios/presentacion';

export type FiltrosDeProveedores = {
  busqueda: string | null;
  desactivados: boolean;
  pagina: number;
};
export type FilaDeProveedor = {
  id: string;
  nombre: string;
  telefono: string | null;
  que_compra: string | null;
  activo: boolean;
};
export type Proveedor = FilaDeProveedor & {
  ubicacion: string | null;
  observaciones: string | null;
};
export type ListaDeProveedores = { filas: FilaDeProveedor[]; total: number; pagina: number };

type Filtrable<T> = {
  eq(columna: string, valor: boolean): T;
  ilike(columna: string, patron: string): T;
};

// En ilike, % y _ son comodines y PostgREST lee * como %: los dos primeros se escapan y el *
// pasa a _, un comodin de un solo caracter que despues se descarta comparando exacto.
export function escapado(texto: string): string {
  return texto.replace(/[\\%_]/g, '\\$&').replace(/\*/g, '_');
}

export function patronDe(texto: string): string {
  return `%${escapado(texto)}%`;
}

function filtrar<T extends Filtrable<T>>(
  consulta: T,
  { busqueda, desactivados }: FiltrosDeProveedores,
): T {
  const porEstado = consulta.eq('activo', !desactivados);
  return busqueda ? porEstado.ilike('nombre', patronDe(busqueda)) : porEstado;
}

async function contar(cliente: Cliente, filtros: FiltrosDeProveedores): Promise<number> {
  const consulta = cliente.from('proveedores').select('id', { count: 'exact', head: true });
  const { count, error } = await filtrar(consulta, filtros);
  if (error) throw new Error(`No pudimos contar los proveedores: ${error.message}`);
  return count ?? 0;
}

/** Una pagina de proveedores del local, por nombre. RLS deja leerlos solo al admin activo. */
export async function listarProveedores(
  cliente: Cliente,
  filtros: FiltrosDeProveedores,
): Promise<ListaDeProveedores> {
  const total = await contar(cliente, filtros);
  const pagina = Math.min(filtros.pagina, cantidadDePaginas(total));
  const desde = (pagina - 1) * POR_PAGINA;
  const consulta = cliente.from('proveedores').select('id, nombre, telefono, que_compra, activo');
  const { data, error } = await filtrar(consulta, filtros)
    .order('nombre')
    .order('id')
    .range(desde, desde + POR_PAGINA - 1);
  if (error) throw new Error(`No pudimos leer los proveedores: ${error.message}`);
  return { filas: data, total, pagina };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Un id mal escrito en la URL no es un error: no hay proveedor, y la pantalla da 404. */
export async function proveedorPorId(cliente: Cliente, id: string): Promise<Proveedor | null> {
  if (!UUID.test(id)) return null;
  const { data, error } = await cliente
    .from('proveedores')
    .select('id, nombre, telefono, que_compra, activo, ubicacion, observaciones')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`No pudimos leer el proveedor: ${error.message}`);
  return data;
}

/** El nombre de un proveedor del local que se llama igual, sin importar mayusculas. */
export async function nombreRepetido(cliente: Cliente, nombre: string): Promise<string | null> {
  const buscado = nombre.trim().toLowerCase();
  const { data, error } = await cliente
    .from('proveedores')
    .select('nombre')
    .ilike('nombre', escapado(nombre.trim()))
    .limit(20);
  if (error) throw new Error(`No pudimos revisar el nombre: ${error.message}`);
  return data.find((fila) => fila.nombre.toLowerCase() === buscado)?.nombre ?? null;
}

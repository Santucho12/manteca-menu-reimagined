import { randomUUID } from 'node:crypto';
import type { Cliente } from '../src/lib/supabase/cliente';
import { clienteSecretoDePruebas } from './clientes';
import { asegurarLocalB, idDelLocalPrincipal } from './locales';

export type SemillaDeCategoria = {
  otroLocal?: boolean;
  visible?: boolean;
  activo?: boolean;
  presentaciones?: string[];
  // Un monto por presentacion, en centavos; null es sin precio compartido.
  compartidos?: (number | null)[];
};
export type SemillaDeProducto = {
  visible?: boolean;
  activo?: boolean;
  // Un monto propio por presentacion, en centavos; null es heredar.
  precios?: (number | null)[];
  etiqueta?: 'mas_vendido' | 'artesanal' | 'nuevo' | null;
};
export type CategoriaSembrada = {
  id: string;
  nombre: string;
  localId: string;
  presentaciones: { id: string; nombre: string }[];
};
export type ProductoSembrado = { id: string; nombre: string };
type TablaDelMenu = 'categorias' | 'presentaciones' | 'productos' | 'precios' | 'aumentos';

export function nombreDePrueba(prefijo: string): string {
  return `${prefijo} ${randomUUID().slice(0, 8)}`;
}

function comprobar(error: { message: string } | null, que: string): void {
  if (error) throw new Error(`No pude ${que}: ${error.message}`);
}

async function siguienteOrden(
  secreto: Cliente,
  tabla: 'categorias' | 'productos',
  filtro: Record<string, string>,
): Promise<number> {
  const { data, error } = await secreto
    .from(tabla)
    .select('orden')
    .match(filtro)
    .order('orden', { ascending: false })
    .limit(1);
  comprobar(error, `leer el orden de ${tabla}`);
  return (data?.[0]?.orden ?? -1) + 1;
}

async function insertarCategoria(secreto: Cliente, localId: string, semilla: SemillaDeCategoria) {
  const fila = {
    local_id: localId,
    nombre: nombreDePrueba('Categoria'),
    icono: '🥐',
    orden: await siguienteOrden(secreto, 'categorias', { local_id: localId }),
    visible: semilla.visible ?? true,
    activo: semilla.activo ?? true,
  };
  const { data, error } = await secreto
    .from('categorias')
    .insert(fila)
    .select('id, nombre')
    .single();
  comprobar(error, 'sembrar la categoria');
  return data!;
}

async function insertarPresentaciones(
  secreto: Cliente,
  categoria: string,
  localId: string,
  nombres: string[],
) {
  const filas = nombres.map((nombre, orden) => ({
    local_id: localId,
    categoria_id: categoria,
    nombre,
    orden,
  }));
  const { data, error } = await secreto
    .from('presentaciones')
    .insert(filas)
    .select('id, nombre, orden');
  comprobar(error, 'sembrar las presentaciones');
  return data!.sort((a, b) => a.orden - b.orden).map(({ id, nombre }) => ({ id, nombre }));
}

async function insertarPrecios(
  secreto: Cliente,
  categoria: CategoriaSembrada,
  productoId: string | null,
  montos: (number | null)[],
) {
  const filas = categoria.presentaciones
    .map((presentacion, i) => ({ presentacion, monto: montos[i] ?? null }))
    .filter(({ monto }) => monto !== null)
    .map(({ presentacion, monto }) => ({
      local_id: categoria.localId,
      presentacion_id: presentacion.id,
      producto_id: productoId,
      monto_centavos: monto!,
    }));
  if (filas.length === 0) return;
  const { error } = await secreto.from('precios').insert(filas);
  comprobar(error, 'sembrar los precios');
}

/** Una categoria de prueba con nombre unico, visible y activa salvo que se pida otra cosa. */
export async function sembrarCategoria(
  semilla: SemillaDeCategoria = {},
): Promise<CategoriaSembrada> {
  const secreto = clienteSecretoDePruebas();
  const localId = semilla.otroLocal
    ? await asegurarLocalB(secreto)
    : await idDelLocalPrincipal(secreto);
  const { id, nombre } = await insertarCategoria(secreto, localId, semilla);
  const nombres = semilla.presentaciones ?? ['Unidad'];
  const presentaciones = await insertarPresentaciones(secreto, id, localId, nombres);
  const categoria = { id, nombre, localId, presentaciones };
  await insertarPrecios(secreto, categoria, null, semilla.compartidos ?? []);
  return categoria;
}

/** Un producto de prueba. Por defecto, visible y con $1.000 en la primera presentacion. */
export async function sembrarProducto(
  categoria: CategoriaSembrada,
  semilla: SemillaDeProducto = {},
): Promise<ProductoSembrado> {
  const secreto = clienteSecretoDePruebas();
  const fila = {
    local_id: categoria.localId,
    categoria_id: categoria.id,
    nombre: nombreDePrueba('Producto'),
    etiqueta: semilla.etiqueta ?? null,
    orden: await siguienteOrden(secreto, 'productos', { categoria_id: categoria.id }),
    visible: semilla.visible ?? true,
    activo: semilla.activo ?? true,
  };
  const { data, error } = await secreto
    .from('productos')
    .insert(fila)
    .select('id, nombre')
    .single();
  comprobar(error, 'sembrar el producto');
  await insertarPrecios(secreto, categoria, data!.id, semilla.precios ?? [100000]);
  return data!;
}

/** Una fila de una tabla del menu, leida sin RLS. */
export async function filaDe(tabla: TablaDelMenu, id: string) {
  const { data, error } = await clienteSecretoDePruebas()
    .from(tabla)
    .select('*')
    .eq('id', id)
    .single();
  comprobar(error, `leer ${tabla} ${id}`);
  return data as Record<string, unknown>;
}

async function idsDe(
  secreto: Cliente,
  tabla: 'presentaciones' | 'productos' | 'aumentos',
  categorias: string[],
) {
  const { data, error } = await secreto.from(tabla).select('id').in('categoria_id', categorias);
  comprobar(error, `leer ${tabla} para limpiar`);
  return (data ?? []).map((fila) => fila.id);
}

async function idsDePrecios(secreto: Cliente, presentaciones: string[]) {
  const { data, error } = await secreto
    .from('precios')
    .select('id')
    .in('presentacion_id', presentaciones);
  comprobar(error, 'leer los precios para limpiar');
  return (data ?? []).map((fila) => fila.id);
}

/** Borra lo que sembro un test, con su auditoria. En la aplicacion nada se borra. */
export async function borrarMenuDePrueba(categorias: string[]): Promise<void> {
  if (categorias.length === 0) return;
  const secreto = clienteSecretoDePruebas();
  const presentaciones = await idsDe(secreto, 'presentaciones', categorias);
  const productos = await idsDe(secreto, 'productos', categorias);
  const aumentos = await idsDe(secreto, 'aumentos', categorias);
  const precios = await idsDePrecios(secreto, presentaciones);
  await secreto.from('precios').delete().in('id', precios);
  await secreto.from('productos').delete().in('id', productos);
  await secreto.from('presentaciones').delete().in('id', presentaciones);
  await secreto.from('aumentos').delete().in('id', aumentos);
  await secreto.from('categorias').delete().in('id', categorias);
  const todos = [...categorias, ...presentaciones, ...productos, ...precios, ...aumentos];
  const { error } = await secreto.from('auditoria').delete().in('registro_id', todos);
  comprobar(error, 'limpiar la auditoria del menu');
}

import { randomUUID } from 'node:crypto';
import type { Json } from '../src/lib/supabase/tipos';
import { clienteSecretoDePruebas } from './clientes';
import { asegurarLocalB, idDelLocalPrincipal } from './locales';
import { borrarMenuDePrueba, sembrarCategoria, sembrarProducto } from './menu-de-prueba';

export type ParaVender = {
  productoId: string;
  presentacionId: string;
  categoriaId: string;
  /** Como aparece en el selector de la venta: producto · presentacion. */
  texto: string;
};

/** Un producto del menu con precio, listo para venderse. Se limpia con borrarMenuDePrueba. */
export async function productoParaVender(activo = true): Promise<ParaVender> {
  const categoria = await sembrarCategoria();
  const producto = await sembrarProducto(categoria, { activo });
  return {
    productoId: producto.id,
    presentacionId: categoria.presentaciones[0]!.id,
    categoriaId: categoria.id,
    texto: `${producto.nombre} · ${categoria.presentaciones[0]!.nombre}`,
  };
}

export async function idDeCanal(nombre: string, otroLocal = false): Promise<string> {
  const secreto = clienteSecretoDePruebas();
  const local = otroLocal ? await asegurarLocalB(secreto) : await idDelLocalPrincipal(secreto);
  const { data, error } = await secreto
    .from('canales_de_venta')
    .select('id')
    .eq('local_id', local)
    .eq('nombre', nombre)
    .single();
  if (error) throw new Error(`No encontre el canal ${nombre}: ${error.message}`);
  return data.id;
}

export async function sembrarCanal(activo = true): Promise<{ id: string; nombre: string }> {
  const secreto = clienteSecretoDePruebas();
  const fila = {
    local_id: await idDelLocalPrincipal(secreto),
    nombre: `Canal ${randomUUID().slice(0, 8)}`,
    activo,
  };
  const { data, error } = await secreto
    .from('canales_de_venta')
    .insert(fila)
    .select('id, nombre')
    .single();
  if (error) throw new Error(`No pude sembrar el canal: ${error.message}`);
  return data;
}

type Renglon = { producto: ParaVender; cantidad: number; precioCentavos: number };

/** Lo que manda la pantalla al guardar una venta a mano. */
export function datosDeVenta(
  fecha: string,
  canalId: string,
  renglones: Renglon[],
  cambios: Record<string, Json> = {},
): Json {
  return {
    fecha,
    canal_id: canalId,
    medio: 'efectivo',
    comentario: null,
    renglones: renglones.map((r) => ({
      producto_id: r.producto.productoId,
      presentacion_id: r.producto.presentacionId,
      cantidad: r.cantidad,
      precio_unitario_centavos: r.precioCentavos,
    })),
    ...cambios,
  };
}

/** Una venta escrita sin la funcion de guardar: sirve para simular una de Fudo o de otro local. */
type SemillaDeVenta = { origen?: 'manual' | 'fudo'; otroLocal?: boolean; fecha?: string };

async function filaDeVenta(semilla: SemillaDeVenta) {
  const secreto = clienteSecretoDePruebas();
  const origen = semilla.origen ?? 'manual';
  return {
    local_id: semilla.otroLocal
      ? await asegurarLocalB(secreto)
      : await idDelLocalPrincipal(secreto),
    origen,
    fudo_id: origen === 'fudo' ? randomUUID() : null,
    fecha: semilla.fecha ?? '2026-10-05',
    total_centavos: 100000,
  };
}

export async function sembrarVenta(semilla: SemillaDeVenta = {}): Promise<{ id: string }> {
  const { data, error } = await clienteSecretoDePruebas()
    .from('ventas')
    .insert(await filaDeVenta(semilla))
    .select('id')
    .single();
  if (error) throw new Error(`No pude sembrar la venta: ${error.message}`);
  return data;
}

export async function ventaDe(id: string) {
  const { data, error } = await clienteSecretoDePruebas()
    .from('ventas')
    .select('*, renglones:renglones_de_venta(*), pagos:pagos_de_venta(*)')
    .eq('id', id)
    .single();
  if (error) throw new Error(`No pude leer la venta ${id}: ${error.message}`);
  return data as unknown as Record<string, unknown> & {
    renglones: Record<string, unknown>[];
    pagos: Record<string, unknown>[];
  };
}

/** Borra ventas de prueba con sus renglones, pagos, canales, menu y auditoria. */
export async function borrarVentas(
  ventas: string[],
  extras: { canales?: string[]; categoriasDelMenu?: string[] } = {},
) {
  const secreto = clienteSecretoDePruebas();
  await secreto.from('renglones_de_venta').delete().in('venta_id', ventas);
  await secreto.from('pagos_de_venta').delete().in('venta_id', ventas);
  await secreto.from('ventas').delete().in('id', ventas);
  await secreto
    .from('canales_de_venta')
    .delete()
    .in('id', extras.canales ?? []);
  await secreto
    .from('auditoria')
    .delete()
    .in('registro_id', [...ventas, ...(extras.canales ?? [])]);
  await borrarMenuDePrueba(extras.categoriasDelMenu ?? []);
}

/** Las ventas cargadas por pantalla con ese comentario. */
export async function idsDeVentasComentadas(comentario: string): Promise<string[]> {
  const { data } = await clienteSecretoDePruebas()
    .from('ventas')
    .select('id')
    .eq('comentario', comentario);
  return (data ?? []).map((venta) => venta.id);
}

/** Los canales cargados por pantalla con esos nombres. */
export async function idsDeCanalesLlamados(nombres: string[]): Promise<string[]> {
  const { data } = await clienteSecretoDePruebas()
    .from('canales_de_venta')
    .select('id')
    .in('nombre', nombres);
  return (data ?? []).map((canal) => canal.id);
}

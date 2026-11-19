import { randomUUID } from 'node:crypto';
import type { Json } from '../src/lib/supabase/tipos';
import { POR_PAGINA } from '../src/lib/usuarios/presentacion';
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
export async function productoParaVender(activo = true, nombre?: string): Promise<ParaVender> {
  const categoria = await sembrarCategoria();
  const producto = await sembrarProducto(categoria, { activo, nombre });
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
    .ilike('nombre', nombre)
    .single();
  if (error) throw new Error(`No encontre el canal ${nombre}: ${error.message}`);
  return data.id;
}

export async function sembrarCanal(
  activo = true,
  nombre = `Canal ${randomUUID().slice(0, 8)}`,
): Promise<{ id: string; nombre: string }> {
  const secreto = clienteSecretoDePruebas();
  const fila = {
    local_id: await idDelLocalPrincipal(secreto),
    nombre,
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
type SemillaDeVenta = {
  origen?: 'manual' | 'fudo' | 'mostrador';
  otroLocal?: boolean;
  fecha?: string;
  canalId?: string;
};

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
    canal_id: semilla.canalId ?? null,
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

/** Una venta más de las que entran en una página, todas del mismo día: la lista se pagina. */
export async function sembrarVentasParaPaginar(fecha: string): Promise<string[]> {
  const fila = await filaDeVenta({ fecha });
  const filas = Array.from({ length: POR_PAGINA + 1 }, () => ({ ...fila }));
  const { data, error } = await clienteSecretoDePruebas().from('ventas').insert(filas).select('id');
  if (error) throw new Error(`No pude sembrar las ventas: ${error.message}`);
  return data.map((venta) => venta.id);
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

// La auditoria de un renglon o de un pago lleva su propio id, no el de la venta.
async function idsDeRenglonesYPagos(ventas: string[]): Promise<string[]> {
  const secreto = clienteSecretoDePruebas();
  const [renglones, pagos] = await Promise.all([
    secreto.from('renglones_de_venta').select('id').in('venta_id', ventas),
    secreto.from('pagos_de_venta').select('id').in('venta_id', ventas),
  ]);
  return [...(renglones.data ?? []), ...(pagos.data ?? [])].map((fila) => String(fila.id));
}

/** Borra ventas de prueba con sus renglones, pagos, canales, menu y la auditoria de todo eso. */
export async function borrarVentas(
  ventas: string[],
  extras: { canales?: string[]; categoriasDelMenu?: string[] } = {},
) {
  const secreto = clienteSecretoDePruebas();
  const hijos = await idsDeRenglonesYPagos(ventas);
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
    .in('registro_id', [...ventas, ...hijos, ...(extras.canales ?? [])]);
  await borrarMenuDePrueba(extras.categoriasDelMenu ?? []);
}

/** Las ventas que llevan ese producto: las del mostrador no tienen comentario para buscarlas. */
export async function idsDeVentasDelProducto(productoId: string): Promise<string[]> {
  const { data } = await clienteSecretoDePruebas()
    .from('renglones_de_venta')
    .select('venta_id')
    .eq('producto_id', productoId);
  return [...new Set((data ?? []).map((renglon) => renglon.venta_id))];
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

type VentaConPago = {
  fecha: string;
  medio: 'efectivo' | 'credito' | 'debito' | 'qr' | 'transferencia' | 'fuera_de_caja';
  centavos: number;
  estado?: 'cerrada' | 'cancelada';
  anulada?: boolean;
  otroLocal?: boolean;
  /** 1 es el Mediodia y 2 la Noche (por defecto, la Noche). */
  turno?: 1 | 2;
};

async function localDe(otroLocal: boolean | undefined) {
  const secreto = clienteSecretoDePruebas();
  return otroLocal ? asegurarLocalB(secreto) : idDelLocalPrincipal(secreto);
}

function filaDeVentaConPago(semilla: VentaConPago, local: string) {
  return {
    local_id: local,
    origen: 'manual' as const,
    fecha: semilla.fecha,
    estado: semilla.estado ?? 'cerrada',
    total_centavos: semilla.centavos,
    anulado: semilla.anulada ?? false,
    motivo_anulacion: semilla.anulada ? 'Prueba' : null,
    turno: semilla.turno ?? 2,
  };
}

/** Una venta de un dia con un solo pago, escrita sin la funcion de guardar. */
export async function sembrarVentaConPago(semilla: VentaConPago): Promise<string> {
  const secreto = clienteSecretoDePruebas();
  const local = await localDe(semilla.otroLocal);
  const fila = filaDeVentaConPago(semilla, local);
  const { data, error } = await secreto.from('ventas').insert(fila).select('id').single();
  if (error) throw new Error(`No pude sembrar la venta: ${error.message}`);
  const pago = { local_id: local, venta_id: data.id, medio: semilla.medio };
  const pagado = await secreto
    .from('pagos_de_venta')
    .insert({ ...pago, monto_centavos: semilla.centavos });
  if (pagado.error) throw new Error(`No pude sembrar el pago: ${pagado.error.message}`);
  return data.id;
}

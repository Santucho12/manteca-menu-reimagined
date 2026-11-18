import { exito, fallo, type Resultado } from '../resultado';
import type { Cliente } from '../supabase/cliente';
import { ventaParaLaBase, type DatosDeVenta } from './esquemas';

export const MENSAJES_DE_VENTAS = {
  sinPermiso: 'No tenés permiso para hacer esto.',
  noDisponible: 'Esa venta no está disponible. Recargá la página.',
  diaFuturo: 'No se puede cargar una venta de un día que todavía no llegó.',
  sinRenglones: 'Sumá al menos un producto.',
  canalNoDisponible: 'Ese tipo de venta ya no está disponible. Elegí otro.',
  productoNoDisponible: 'Uno de los productos ya no está disponible. Revisá la venta.',
  anulada: 'Esta venta está anulada y ya no se puede cambiar.',
  sinMotivo: 'Escribí el motivo de la anulación.',
  deFudo: 'Esta venta vino de Fudo, antes de dejarlo: no se anula.',
  canalRepetido: 'Ya hay un tipo de venta con ese nombre.',
  canalConVentas: 'Ese tipo de venta ya tiene ventas: desactivalo en lugar de borrarlo.',
  generico: 'No pudimos guardarlo. Revisá los datos e intentá de nuevo.',
} as const;

const POR_CODIGO: Record<string, string> = {
  '42501': MENSAJES_DE_VENTAS.sinPermiso,
  PV301: MENSAJES_DE_VENTAS.diaFuturo,
  PV302: MENSAJES_DE_VENTAS.sinRenglones,
  PV303: MENSAJES_DE_VENTAS.canalNoDisponible,
  PV304: MENSAJES_DE_VENTAS.productoNoDisponible,
  PV305: MENSAJES_DE_VENTAS.anulada,
  PV306: MENSAJES_DE_VENTAS.sinMotivo,
  PV307: MENSAJES_DE_VENTAS.deFudo,
  PV309: MENSAJES_DE_VENTAS.canalConVentas,
  '23505': MENSAJES_DE_VENTAS.canalRepetido,
};

const mensajeDe = (error: { code?: string }) =>
  POR_CODIGO[error.code ?? ''] ?? MENSAJES_DE_VENTAS.generico;

type Respuesta = { data: { id: string }[] | null; error: { code?: string } | null };

// RLS no da error si la fila no es del local: se comprueba que haya cambiado una.
function alCambiar({ data, error }: Respuesta): Resultado {
  if (error) return fallo(mensajeDe(error));
  return data?.length === 1 ? exito(undefined) : fallo(MENSAJES_DE_VENTAS.noDisponible);
}

/** Guarda la venta con sus renglones y su pago de una vez; los totales los calcula la base. */
export async function guardarVenta(
  cliente: Cliente,
  datos: DatosDeVenta,
): Promise<Resultado<{ id: string }>> {
  const { data, error } = await cliente.rpc('ventas_guardar_manual', {
    datos: ventaParaLaBase(datos),
  });
  return error ? fallo(mensajeDe(error)) : exito({ id: data });
}

/** Una venta a mano no se edita: se anula con motivo y se carga de nuevo. */
export async function anularVenta(cliente: Cliente, id: string, motivo: string) {
  return alCambiar(
    await cliente
      .from('ventas')
      .update({ anulado: true, motivo_anulacion: motivo })
      .eq('id', id)
      .select('id'),
  );
}

export async function crearCanal(
  cliente: Cliente,
  { nombre }: { nombre: string },
): Promise<Resultado<{ id: string }>> {
  const { data, error } = await cliente
    .from('canales_de_venta')
    .insert({ nombre: nombre.trim() })
    .select('id')
    .single();
  return error ? fallo(mensajeDe(error)) : exito({ id: data.id });
}

export async function editarCanal(cliente: Cliente, id: string, { nombre }: { nombre: string }) {
  return alCambiar(
    await cliente
      .from('canales_de_venta')
      .update({ nombre: nombre.trim() })
      .eq('id', id)
      .select('id'),
  );
}

/** Borra un canal que nunca se uso; uno con ventas se desactiva (lo dice la base). */
export async function borrarCanal(cliente: Cliente, id: string): Promise<Resultado> {
  const { error } = await cliente.rpc('ventas_borrar_canal', { el_canal: id });
  return error ? fallo(mensajeDe(error)) : exito(undefined);
}

export async function cambiarEstadoDeCanal(cliente: Cliente, id: string, activo: boolean) {
  return alCambiar(
    await cliente.from('canales_de_venta').update({ activo }).eq('id', id).select('id'),
  );
}

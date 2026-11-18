import { exito, fallo, type Resultado } from '../resultado';
import type { Cliente } from '../supabase/cliente';
import { ventaDelMostradorParaLaBase, type VentaDelMostrador } from './esquemas';

export const MENSAJES_DEL_MOSTRADOR = {
  sinPermiso: 'No tenés permiso para vender.',
  sinProductos: 'Sumá al menos un producto.',
  productoNoDisponible: 'Uno de los productos ya no se vende. Sacalo del ticket.',
  precio: 'Cambió un precio mientras armabas el ticket. Revisalo antes de cobrar.',
  pagos: 'Los pagos no suman el total. Revisá cómo se cobra.',
  generico: 'No pudimos guardar la venta. Revisá la conexión y probá de nuevo.',
} as const;

const POR_CODIGO: Record<string, string> = {
  '42501': MENSAJES_DEL_MOSTRADOR.sinPermiso,
  PV302: MENSAJES_DEL_MOSTRADOR.sinProductos,
  PV304: MENSAJES_DEL_MOSTRADOR.productoNoDisponible,
  PV310: MENSAJES_DEL_MOSTRADOR.precio,
  PV311: MENSAJES_DEL_MOSTRADOR.pagos,
};

export type VentaGuardada = { id: string; totalCentavos: number };

/**
 * Guarda la venta del mostrador. La base vuelve a calcular cada precio y el total con el menú, y
 * la misma clave mandada dos veces devuelve la venta que ya estaba.
 */
export async function guardarVentaDelMostrador(
  cliente: Cliente,
  venta: VentaDelMostrador,
): Promise<Resultado<VentaGuardada>> {
  const { data, error } = await cliente.rpc('ventas_guardar_mostrador', {
    datos: ventaDelMostradorParaLaBase(venta),
  });
  if (error) return fallo(POR_CODIGO[error.code ?? ''] ?? MENSAJES_DEL_MOSTRADOR.generico);
  const guardada = data as { id: string; total_centavos: number };
  return exito({ id: guardada.id, totalCentavos: guardada.total_centavos });
}

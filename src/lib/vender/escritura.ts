import { exito, fallo, type Resultado } from '../resultado';
import type { Cliente } from '../supabase/cliente';
import { ventaDelMostradorParaLaBase, type VentaDelMostrador } from './esquemas';

export const MENSAJES_DEL_MOSTRADOR = {
  sinPermiso: 'No tenés permiso para vender.',
  sinProductos: 'Sumá al menos un producto.',
  productoNoDisponible: 'Uno de los productos ya no se vende. Sacalo del ticket.',
  precio: 'Cambió un precio mientras armabas el ticket. Revisalo antes de cobrar.',
  pagos: 'Los pagos no suman el total. Revisá cómo se cobra.',
  horaDelCierre: 'Es hora del cierre de caja: cargalo o postergalo para seguir vendiendo.',
  cajaCerrada: 'La caja de hoy ya cerró. Mañana se vuelve a vender.',
  nadaParaPostergar: 'No hay ningún cierre para postergar.',
  descuento: 'El descuento no es válido: revisá el número y el motivo.',
  generico: 'No pudimos guardar la venta. Revisá la conexión y probá de nuevo.',
} as const;

const POR_CODIGO: Record<string, string> = {
  '42501': MENSAJES_DEL_MOSTRADOR.sinPermiso,
  PV302: MENSAJES_DEL_MOSTRADOR.sinProductos,
  PV304: MENSAJES_DEL_MOSTRADOR.productoNoDisponible,
  PV310: MENSAJES_DEL_MOSTRADOR.precio,
  PV311: MENSAJES_DEL_MOSTRADOR.pagos,
  PV320: MENSAJES_DEL_MOSTRADOR.descuento,
  PV314: MENSAJES_DEL_MOSTRADOR.horaDelCierre,
  PV315: MENSAJES_DEL_MOSTRADOR.cajaCerrada,
  PC310: MENSAJES_DEL_MOSTRADOR.nadaParaPostergar,
};

/** Los rechazos que abren la ventana del cierre en el mostrador. */
export const esRechazoDeLaTraba = (mensaje: string) =>
  mensaje === MENSAJES_DEL_MOSTRADOR.horaDelCierre ||
  mensaje === MENSAJES_DEL_MOSTRADOR.cajaCerrada;

/** sinConexion: quedó en el equipo y se manda sola al volver internet (pedido 102). */
export type VentaGuardada = { id: string; totalCentavos: number; sinConexion?: boolean };

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

/** Diez minutos más para cargar el cierre que traba el mostrador; devuelve hasta cuándo. */
export async function postergarCierre(cliente: Cliente): Promise<Resultado<{ hasta: string }>> {
  const { data, error } = await cliente.rpc('caja_postergar_cierre');
  if (error) return fallo(POR_CODIGO[error.code ?? ''] ?? MENSAJES_DEL_MOSTRADOR.generico);
  return exito({ hasta: data });
}

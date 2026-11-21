import { sumarDias } from '../reportes/periodos';
import type { Cliente } from '../supabase/cliente';

type VentaParaAvisar = { total_centavos: number; descuento_centavos: number; editada: boolean };

/** Un descuento es grande desde el 30 % de lo que sumaba la venta (pedido 102). */
export function contarAvisosDeVentas(ventas: VentaParaAvisar[]) {
  const grande = (v: VentaParaAvisar) =>
    v.descuento_centavos > 0 &&
    v.descuento_centavos * 10 >= (v.total_centavos + v.descuento_centavos) * 3;
  return {
    descuentosGrandes: ventas.filter(grande).length,
    editadasHoy: ventas.filter((v) => v.editada).length,
  };
}

// "Hoy" es el día en Argentina (UTC-3): de las 03:00 UTC de hoy a las de mañana.
export async function ventasParaAvisar(cliente: Cliente, hoy: string) {
  const { data, error } = await cliente
    .from('ventas')
    .select('total_centavos, descuento_centavos, editada')
    .eq('anulado', false)
    .or('descuento_centavos.gt.0,editada.eq.true')
    .gte('fecha', `${hoy}T03:00:00Z`)
    .lt('fecha', `${sumarDias(hoy, 1)}T03:00:00Z`);
  if (error) throw new Error(error.message);
  // Los tipos generados no tienen todavía las columnas del descuento (pedido 102).
  return contarAvisosDeVentas((data ?? []) as unknown as VentaParaAvisar[]);
}

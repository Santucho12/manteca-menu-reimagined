import { estadoDeFila, type EstadoDelTurno, type FilaDelEstado } from '../caja/turnos';
import type { Cliente } from '../supabase/cliente';
import { catalogoDeFilas, type CategoriaParaVender } from './catalogo';

/**
 * Lo que se vende en el mostrador: cada producto activo con el precio que rige, se muestre o no
 * en la carta. Lo lee Caja, que no ve las tablas del menú: sale de una función de la base.
 */
export async function catalogoParaVender(cliente: Cliente): Promise<CategoriaParaVender[]> {
  const { data, error } = await cliente.rpc('catalogo_para_vender');
  if (error) throw new Error(`No pudimos leer lo que se vende: ${error.message}`);
  return catalogoDeFilas(data ?? []);
}

/** A qué turno va una venta ahora y si el mostrador está trabado por un cierre, sin montos. */
export async function estadoDelMostrador(cliente: Cliente): Promise<EstadoDelTurno> {
  const { data, error } = await cliente.rpc('caja_estado_del_mostrador');
  if (error) throw new Error(`No pudimos leer el estado de la caja: ${error.message}`);
  return estadoDeFila((data as unknown as FilaDelEstado[])[0]!);
}

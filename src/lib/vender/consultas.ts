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

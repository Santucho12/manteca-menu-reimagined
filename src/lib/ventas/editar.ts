import { exito, fallo, type Resultado } from '../resultado';
import type { Cliente } from '../supabase/cliente';
import { edicionParaLaBase, mensajeDeEdicion, type EdicionDeVenta } from './edicion';

/** Guarda la venta editada: la base vuelve a hacer la cuenta y deja el cambio en Auditoría. */
export async function editarVenta(
  cliente: Cliente,
  edicion: EdicionDeVenta,
): Promise<Resultado<{ id: string }>> {
  const { error } = await cliente.rpc('ventas_editar', edicionParaLaBase(edicion));
  return error ? fallo(mensajeDeEdicion(error.code)) : exito({ id: edicion.id });
}

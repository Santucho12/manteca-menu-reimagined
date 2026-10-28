import { exito, fallo, type Resultado } from '../resultado';
import type { Cliente } from '../supabase/cliente';
import { cierreParaLaBase, type DatosDeCierre } from './esquemas';

export const MENSAJES_DE_CAJA = {
  sinPermiso: 'No tenés permiso para hacer esto.',
  noDisponible: 'Ese cierre no está disponible. Recargá la página.',
  diaFuturo: 'No se puede cargar el cierre de un día que todavía no llegó.',
  diaRepetido: 'Ya hay un cierre cargado para ese día. Si está mal, abrilo y editalo.',
  anulado: 'Este cierre está anulado y ya no se puede cambiar.',
  sinMotivo: 'Escribí el motivo de la anulación.',
  generico: 'No pudimos guardarlo. Revisá los datos e intentá de nuevo.',
} as const;

const POR_CODIGO: Record<string, string> = {
  '42501': MENSAJES_DE_CAJA.sinPermiso,
  PC301: MENSAJES_DE_CAJA.diaFuturo,
  PC302: MENSAJES_DE_CAJA.diaRepetido,
  PC303: MENSAJES_DE_CAJA.anulado,
  PC304: MENSAJES_DE_CAJA.sinMotivo,
};

const mensajeDe = (error: { code?: string }) =>
  POR_CODIGO[error.code ?? ''] ?? MENSAJES_DE_CAJA.generico;

/** Guarda el cierre con sus retiros y sus gastos de una vez; queda a nombre de la sesion. */
export async function guardarCierre(
  cliente: Cliente,
  datos: DatosDeCierre,
): Promise<Resultado<{ id: string }>> {
  const { data, error } = await cliente.rpc('cierres_guardar', { datos: cierreParaLaBase(datos) });
  return error ? fallo(mensajeDe(error)) : exito({ id: data });
}

/** Cambia lo declarado, los retiros y los gastos de caja de un cierre sin anular. */
export async function editarCierre(
  cliente: Cliente,
  id: string,
  datos: DatosDeCierre,
): Promise<Resultado> {
  const { error } = await cliente.rpc('cierres_editar', {
    el_id: id,
    datos: cierreParaLaBase(datos),
  });
  return error ? fallo(mensajeDe(error)) : exito(undefined);
}

// RLS no da error si el cierre no es del local o quien pide no es admin: se comprueba que
// haya cambiado una fila.
async function anular(cliente: Cliente, id: string, motivo: string): Promise<Resultado> {
  const { data, error } = await cliente
    .from('cierres_de_caja')
    .update({ anulado: true, motivo_anulacion: motivo })
    .eq('id', id)
    .select('id');
  if (error) return fallo(mensajeDe(error));
  return data.length === 1 ? exito(undefined) : fallo(MENSAJES_DE_CAJA.noDisponible);
}

/** Anular deja libre el dia y anula los gastos que salieron del cierre. */
export function anularCierre(cliente: Cliente, id: string, motivo: string) {
  return anular(cliente, id, motivo);
}

export async function cambiarTolerancia(cliente: Cliente, centavos: number): Promise<Resultado> {
  const { data, error } = await cliente
    .from('configuracion_de_caja')
    .update({ tolerancia_centavos: centavos })
    .not('id', 'is', null)
    .select('id');
  if (error) return fallo(mensajeDe(error));
  return data.length === 1 ? exito(undefined) : fallo(MENSAJES_DE_CAJA.sinPermiso);
}

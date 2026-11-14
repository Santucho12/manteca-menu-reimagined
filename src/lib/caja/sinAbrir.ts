import { exito, fallo, type Resultado } from '../resultado';
import type { Cliente } from '../supabase/cliente';
import { MENSAJES_DE_CAJA } from './escritura';

export const MENSAJES_DE_SIN_ABRIR = {
  conCierre: 'Ese día tiene un cierre cargado: no se puede marcar como que no abrió.',
  diaFuturo: 'Ese día todavía no llegó.',
  sinPermiso: MENSAJES_DE_CAJA.sinPermiso,
  generico: MENSAJES_DE_CAJA.generico,
} as const;

const POR_CODIGO: Record<string, string> = {
  '42501': MENSAJES_DE_SIN_ABRIR.sinPermiso,
  PC307: MENSAJES_DE_SIN_ABRIR.conCierre,
  PC308: MENSAJES_DE_SIN_ABRIR.diaFuturo,
};

/** Los días del rango que el admin marcó como que el local no abrió. Solo el admin los lee. */
export async function diasSinAbrir(
  cliente: Cliente,
  desde: string,
  hasta: string,
): Promise<string[]> {
  const { data, error } = await cliente
    .from('dias_sin_abrir')
    .select('fecha')
    .eq('activo', true)
    .gte('fecha', desde)
    .lte('fecha', hasta);
  if (error) throw new Error(`No pudimos leer los días sin abrir: ${error.message}`);
  return data.map((fila) => fila.fecha);
}

/** Marca un día como que el local no abrió, o deshace la marca. */
export async function marcarSinAbrir(
  cliente: Cliente,
  fecha: string,
  marcar: boolean,
): Promise<Resultado> {
  const { error } = await cliente.rpc('cierres_marcar_sin_abrir', { la_fecha: fecha, marcar });
  if (!error) return exito(undefined);
  return fallo(POR_CODIGO[error.code ?? ''] ?? MENSAJES_DE_SIN_ABRIR.generico);
}

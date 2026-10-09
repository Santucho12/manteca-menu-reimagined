import type { EstadoDeAcceso } from '../acceso/estados';
import type { Cliente } from '../supabase/cliente';
import { crearClienteSecreto } from '../supabase/secreto';

/**
 * Crea los gastos recurrentes que vencieron hasta hoy y todavia no existen. Lo corre pg_cron
 * cada dia; al abrir Gastos se corre tambien, para no esperar a la madrugada. Pide el cliente
 * secreto: es un proceso sin usuario y los gastos quedan a nombre del sistema.
 */
export async function generarAtrasados(secreto: Cliente, hoy: string): Promise<number> {
  const { data, error } = await secreto.rpc('generar_gastos_recurrentes', { hasta: hoy });
  if (error) throw new Error(`No pudimos generar los gastos recurrentes: ${error.message}`);
  return data;
}

/** Al abrir Gastos: la clave secreta corre solo si quien abre es un admin activo. */
export async function generarAlAbrir(estado: EstadoDeAcceso, hoy: string): Promise<number> {
  if (estado !== 'admin') return 0;
  return generarAtrasados(crearClienteSecreto(), hoy);
}

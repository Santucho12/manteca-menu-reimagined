import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { leerEntornoPublico } from '../entorno/publico';
import { leerEntornoServidor } from '../entorno/servidor';

/**
 * Unico lugar donde se usa la clave secreta, que saltea RLS.
 * Solo para sembrar y limpiar en tests, procesos automaticos sin usuario
 * y administrar cuentas despues de verificar que lo pide un admin.
 */
export function crearClienteSecreto(): SupabaseClient {
  const { NEXT_PUBLIC_SUPABASE_URL } = leerEntornoPublico();
  const { SUPABASE_SECRET_KEY } = leerEntornoServidor();
  return createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

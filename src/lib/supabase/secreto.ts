import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { leerEntornoPublico } from '../entorno/publico';
import { validarEntorno } from '../entorno/validar';

const esquema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(1),
});

/**
 * Unico lugar donde se lee y se usa la clave secreta, que saltea RLS.
 * Solo para sembrar y limpiar en tests, procesos automaticos sin usuario
 * y administrar cuentas despues de verificar que lo pide un admin.
 * La clave no se exporta: quien la necesite pide este cliente.
 */
export function crearClienteSecreto(): SupabaseClient {
  const { NEXT_PUBLIC_SUPABASE_URL } = leerEntornoPublico();
  const { SUPABASE_SECRET_KEY } = validarEntorno(esquema, {
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  });
  return createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

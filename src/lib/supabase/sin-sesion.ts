import { createClient } from '@supabase/supabase-js';
import { leerEntornoPublico } from '../entorno/publico';
import type { Cliente } from './cliente';

/** Cliente con la clave publicable que no guarda la sesion: para comprobar una contraseña aparte. */
export function crearClienteSinSesion(): Cliente {
  const entorno = leerEntornoPublico();
  return createClient(
    entorno.NEXT_PUBLIC_SUPABASE_URL,
    entorno.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

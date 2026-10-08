import { createBrowserClient } from '@supabase/ssr';
import { leerEntornoPublico } from '../entorno/publico';
import type { Cliente } from './cliente';
import type { Database } from './tipos';

/** Cliente del navegador, con la sesion de las cookies: sube la foto directo a Storage. */
export function crearClienteDelNavegador(): Cliente {
  const entorno = leerEntornoPublico();
  return createBrowserClient<Database>(
    entorno.NEXT_PUBLIC_SUPABASE_URL,
    entorno.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

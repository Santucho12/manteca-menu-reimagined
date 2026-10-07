import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { leerEntornoPublico } from '../entorno/publico';
import type { Cliente } from './cliente';
import type { Database } from './tipos';

/** Cliente con la sesion de quien hizo el pedido, leida de las cookies. */
export async function crearClienteDelServidor(): Promise<Cliente> {
  const almacen = await cookies();
  const entorno = leerEntornoPublico();
  return createServerClient<Database>(
    entorno.NEXT_PUBLIC_SUPABASE_URL,
    entorno.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => almacen.getAll(),
        setAll: (galletas) => {
          try {
            galletas.forEach(({ name, value, options }) => almacen.set(name, value, options));
          } catch {
            // Un componente de servidor no puede escribir cookies: el proxy ya refresco la sesion.
          }
        },
      },
    },
  );
}

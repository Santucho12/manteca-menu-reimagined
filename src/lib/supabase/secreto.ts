import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { leerEntornoPublico } from '../entorno/publico';
import { validarEntorno } from '../entorno/validar';
import type { Cliente } from './cliente';
import type { Database } from './tipos';

const esquema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(1),
});

/*
 * Unico lugar donde se lee y se usa la clave secreta, que saltea RLS.
 * Solo para sembrar y limpiar en tests, procesos automaticos sin usuario
 * y administrar cuentas despues de verificar que lo pide un admin.
 * La clave no se exporta: quien la necesite pide el cliente.
 */
function leerClaveSecreta(): string {
  return validarEntorno(esquema, { SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY })
    .SUPABASE_SECRET_KEY;
}

/** Falla si falta la clave secreta, sin devolverla: sirve para avisar de todo lo que falta junto. */
export function exigirClaveSecreta(): void {
  leerClaveSecreta();
}

export function crearClienteSecreto(): Cliente {
  const { NEXT_PUBLIC_SUPABASE_URL } = leerEntornoPublico();
  return createClient<Database>(NEXT_PUBLIC_SUPABASE_URL, leerClaveSecreta(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

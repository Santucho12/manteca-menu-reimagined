import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { leerEntornoPublico } from '../src/lib/entorno/publico';
import { emailDePrueba, type RolDePrueba } from './cuentas';
import { leerEntornoPruebas } from './entorno-pruebas';

/**
 * Cliente con la sesion de una cuenta de prueba, sobre la clave publicable.
 * Es la misma superficie que usa un atacante: asi se prueban los permisos.
 */
export async function clienteComo(rol: RolDePrueba): Promise<SupabaseClient> {
  const entorno = leerEntornoPublico();
  const cliente = createClient(
    entorno.NEXT_PUBLIC_SUPABASE_URL,
    entorno.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error } = await cliente.auth.signInWithPassword({
    email: emailDePrueba(rol),
    password: leerEntornoPruebas().CONTRASENA_USUARIOS_PRUEBA,
  });
  if (error) throw new Error(`No pude entrar como ${rol}: ${error.message}`);
  return cliente;
}

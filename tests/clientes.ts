import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { leerEntornoPublico } from '../src/lib/entorno/publico';
import { crearClienteSecreto } from '../src/lib/supabase/secreto';
import { exigirBaseDePruebas } from './base-de-pruebas';
import { emailDePrueba, type RolDePrueba } from './cuentas';
import { leerEntornoPruebas } from './entorno-pruebas';

// Ademas de la preparacion, cada cliente comprueba la base al armarse: asi ninguna
// variable que cambie despues manda un test a otro proyecto.
function comprobarBaseDePruebas(): void {
  const { NEXT_PUBLIC_SUPABASE_URL } = leerEntornoPublico();
  exigirBaseDePruebas(NEXT_PUBLIC_SUPABASE_URL, leerEntornoPruebas().SUPABASE_REF_PRUEBAS);
}

/** Cliente con la clave secreta, para sembrar y limpiar. Saltea RLS: no sirve para afirmar accesos. */
export function clienteSecretoDePruebas(): SupabaseClient {
  comprobarBaseDePruebas();
  return crearClienteSecreto();
}

/**
 * Cliente con la sesion de una cuenta de prueba, sobre la clave publicable.
 * Es la misma superficie que usa un atacante: asi se prueban los permisos.
 */
export async function clienteComo(rol: RolDePrueba): Promise<SupabaseClient> {
  comprobarBaseDePruebas();
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

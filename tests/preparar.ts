import { leerEntornoPublico } from '../src/lib/entorno/publico';
import { crearClienteSecreto } from '../src/lib/supabase/secreto';
import { exigirBaseDePruebas } from './base-de-pruebas';
import { sembrarCuentas } from './cuentas';
import { cargarEntornoLocal, leerEntornoPruebas } from './entorno-pruebas';

/**
 * Lo que corre antes de cualquier test que toque la base, y tambien el comando
 * sembrar:pruebas. Primero comprueba la base: recien despues usa la clave secreta.
 */
export async function prepararBaseDePruebas(): Promise<string[]> {
  cargarEntornoLocal();
  const { NEXT_PUBLIC_SUPABASE_URL } = leerEntornoPublico();
  const pruebas = leerEntornoPruebas();
  exigirBaseDePruebas(NEXT_PUBLIC_SUPABASE_URL, pruebas.SUPABASE_REF_PRUEBAS);
  return sembrarCuentas(crearClienteSecreto(), pruebas.CONTRASENA_USUARIOS_PRUEBA);
}

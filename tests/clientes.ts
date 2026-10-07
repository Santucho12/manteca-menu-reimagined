import { leerEntornoPublico } from '../src/lib/entorno/publico';
import type { Cliente } from '../src/lib/supabase/cliente';
import { crearClienteSecreto } from '../src/lib/supabase/secreto';
import { exigirBaseDePruebas } from './base-de-pruebas';
import { leerEntornoPruebas } from './entorno-pruebas';

// Ademas de la preparacion, cada cliente comprueba la base al armarse: asi ninguna
// variable que cambie despues manda un test a otro proyecto.
export function comprobarBaseDePruebas(): void {
  const { NEXT_PUBLIC_SUPABASE_URL } = leerEntornoPublico();
  exigirBaseDePruebas(NEXT_PUBLIC_SUPABASE_URL, leerEntornoPruebas().SUPABASE_REF_PRUEBAS);
}

/** Cliente con la clave secreta, para sembrar y limpiar. Saltea RLS: no sirve para afirmar accesos. */
export function clienteSecretoDePruebas(): Cliente {
  comprobarBaseDePruebas();
  return crearClienteSecreto();
}

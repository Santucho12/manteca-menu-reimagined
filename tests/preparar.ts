import { leerEntornoPublico } from '../src/lib/entorno/publico';
import { FaltanVariables } from '../src/lib/entorno/validar';
import { exigirClaveSecreta } from '../src/lib/supabase/secreto';
import { restaurarHorasDeCierre } from './cierres-de-prueba';
import { clienteSecretoDePruebas } from './clientes';
import { sembrarCuentas } from './cuentas';
import { cargarEntornoLocal, leerEntornoPruebas } from './entorno-pruebas';

function nombresQueFaltan(leer: () => unknown): string[] {
  try {
    leer();
    return [];
  } catch (error) {
    if (error instanceof FaltanVariables) return error.nombres;
    throw error;
  }
}

// Se revisan todas las lecturas antes de empezar, para avisar de todo lo que falta junto y no
// de a una variable por corrida.
function exigirVariables(): void {
  const lecturas = [leerEntornoPublico, leerEntornoPruebas, exigirClaveSecreta];
  const nombres = [...new Set(lecturas.flatMap(nombresQueFaltan))];
  if (nombres.length > 0) throw new FaltanVariables(nombres);
}

/**
 * Lo que corre antes de cualquier test que toque la base, y tambien el comando
 * sembrar:pruebas: las cuentas de prueba y las horas de cierre del local principal. El cliente
 * con la clave secreta comprueba la base antes de armarse.
 */
export async function prepararBaseDePruebas(): Promise<string[]> {
  cargarEntornoLocal();
  exigirVariables();
  const { CONTRASENA_USUARIOS_PRUEBA } = leerEntornoPruebas();
  const creadas = await sembrarCuentas(clienteSecretoDePruebas(), CONTRASENA_USUARIOS_PRUEBA);
  // Con las horas de verdad, a la tarde el mostrador se traba y las pruebas que venden hoy fallan.
  await restaurarHorasDeCierre();
  return creadas;
}

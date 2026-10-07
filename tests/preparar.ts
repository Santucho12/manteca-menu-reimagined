import { clienteSecretoDePruebas } from './clientes';
import { sembrarCuentas } from './cuentas';
import { cargarEntornoLocal, leerEntornoPruebas } from './entorno-pruebas';

/**
 * Lo que corre antes de cualquier test que toque la base, y tambien el comando
 * sembrar:pruebas. El cliente con la clave secreta comprueba la base antes de armarse.
 */
export async function prepararBaseDePruebas(): Promise<string[]> {
  cargarEntornoLocal();
  const { CONTRASENA_USUARIOS_PRUEBA } = leerEntornoPruebas();
  return sembrarCuentas(clienteSecretoDePruebas(), CONTRASENA_USUARIOS_PRUEBA);
}

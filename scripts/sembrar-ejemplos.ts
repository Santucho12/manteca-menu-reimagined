import { diaEnArgentina } from '../src/lib/fechas';
import { clienteSecretoDePruebas } from '../tests/clientes';
import { leerEntornoPruebas } from '../tests/entorno-pruebas';
import { prepararBaseDePruebas } from '../tests/preparar';
import { sembrarEjemplos } from './ejemplos/sembrar';

// Solo en la base de pruebas: el cliente de la clave secreta lo comprueba antes de armarse.
await prepararBaseDePruebas();
const resumen = await sembrarEjemplos(clienteSecretoDePruebas(), {
  hoy: diaEnArgentina(new Date()),
  dias: 365,
  semilla: 89,
  local: 'Local de ejemplo',
  prefijo: 'ejemplo',
  contrasena: leerEntornoPruebas().CONTRASENA_USUARIOS_PRUEBA,
});

console.log(
  `Local de ejemplo listo: ${resumen.ventas} ventas, ${resumen.cierres} cierres y ` +
    `${resumen.gastos} gastos. Entrá con ejemplo.admin@manteca.test o ejemplo.caja@manteca.test, ` +
    'con la contraseña de las cuentas de prueba.',
);

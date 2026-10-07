import { prepararBaseDePruebas } from '../tests/preparar';

const creadas = await prepararBaseDePruebas();

console.log(
  creadas.length === 0
    ? 'Las cuentas de prueba ya estaban todas.'
    : `Cuentas de prueba creadas: ${creadas.join(', ')}`,
);

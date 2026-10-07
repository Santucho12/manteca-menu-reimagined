import { prepararBaseDePruebas } from '../tests/preparar';

export default async function preparacion(): Promise<void> {
  await prepararBaseDePruebas();
}

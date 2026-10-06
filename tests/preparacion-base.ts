import { prepararBaseDePruebas } from './preparar';

export default async function preparacion(): Promise<void> {
  await prepararBaseDePruebas();
}

import type { TestProject } from 'vitest/node';
import { leerEntornoPublico } from '../src/lib/entorno/publico';
import { prepararBaseDePruebas } from './preparar';

declare module 'vitest' {
  export interface ProvidedContext {
    urlDeLaBaseComprobada: string;
  }
}

export default async function preparacion(proyecto: TestProject): Promise<void> {
  await prepararBaseDePruebas();
  // Es la URL que acaba de pasar la comprobacion: los tests se comparan contra ella.
  proyecto.provide('urlDeLaBaseComprobada', leerEntornoPublico().NEXT_PUBLIC_SUPABASE_URL);
}

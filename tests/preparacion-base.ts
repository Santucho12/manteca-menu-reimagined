import type { TestProject } from 'vitest/node';
import { leerEntornoPublico } from '../src/lib/entorno/publico';
import { ROLES_DE_PRUEBA, emailDePrueba, type RolDePrueba } from './cuentas';
import { leerEntornoPruebas } from './entorno-pruebas';
import { iniciarSesion, sesionDe, type Sesion } from './iniciar-sesion';
import { prepararBaseDePruebas } from './preparar';

declare module 'vitest' {
  export interface ProvidedContext {
    urlDeLaBaseComprobada: string;
    sesionesDePrueba: Record<RolDePrueba, Sesion>;
  }
}

// Una sola sesion por rol para toda la corrida: Supabase limita las rafagas de ingresos.
async function abrirSesionesDePrueba(): Promise<Record<RolDePrueba, Sesion>> {
  const { CONTRASENA_USUARIOS_PRUEBA } = leerEntornoPruebas();
  const pares = await Promise.all(
    ROLES_DE_PRUEBA.map(async (rol) => {
      const cliente = await iniciarSesion(emailDePrueba(rol), CONTRASENA_USUARIOS_PRUEBA);
      return [rol, await sesionDe(cliente)] as const;
    }),
  );
  return Object.fromEntries(pares) as Record<RolDePrueba, Sesion>;
}

export default async function preparacion(proyecto: TestProject): Promise<void> {
  await prepararBaseDePruebas();
  // Es la URL que acaba de pasar la comprobacion: los tests se comparan contra ella.
  proyecto.provide('urlDeLaBaseComprobada', leerEntornoPublico().NEXT_PUBLIC_SUPABASE_URL);
  proyecto.provide('sesionesDePrueba', await abrirSesionesDePrueba());
}

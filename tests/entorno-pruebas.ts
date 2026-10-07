import { existsSync } from 'node:fs';
import { z } from 'zod';
import { validarEntorno } from '../src/lib/entorno/validar';

const esquema = z.object({
  SUPABASE_REF_PRUEBAS: z.string().min(1),
  CONTRASENA_USUARIOS_PRUEBA: z.string().min(8),
});

/** Carga .env.local en procesos que no son Next.js: scripts y preparacion de tests. */
export function cargarEntornoLocal(): void {
  if (existsSync('.env.local')) process.loadEnvFile('.env.local');
}

/** Variables que solo usan los tests. */
export function leerEntornoPruebas(): z.infer<typeof esquema> {
  return validarEntorno(esquema, {
    SUPABASE_REF_PRUEBAS: process.env.SUPABASE_REF_PRUEBAS,
    CONTRASENA_USUARIOS_PRUEBA: process.env.CONTRASENA_USUARIOS_PRUEBA,
  });
}

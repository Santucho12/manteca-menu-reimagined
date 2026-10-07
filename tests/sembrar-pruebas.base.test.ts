import { execSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

// Corre el comando de verdad, en otro proceso: arranca npm y tsx, por eso tarda.
const ESPERA_MS = 60_000;
const CLAVE_SECRETA = ['SUPABASE', 'SECRET', 'KEY'].join('_');
const AVISO = 'Faltan o están mal estas variables de entorno';

function correr(variables: Record<string, string> = {}): string {
  return execSync('npm run sembrar:pruebas', {
    encoding: 'utf8',
    stdio: 'pipe',
    env: { ...process.env, ...variables },
  });
}

function avisoDeVariables(variables: Record<string, string>): string {
  try {
    correr(variables);
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    return mensaje.split('\n').find((linea) => linea.includes(AVISO)) ?? '';
  }
  return '';
}

describe('comando sembrar:pruebas', () => {
  it(
    'avisa que las cuentas ya estaban cuando no falta ninguna',
    () => {
      expect(correr()).toContain('Las cuentas de prueba ya estaban todas.');
    },
    ESPERA_MS,
  );

  it(
    'aborta sin sembrar si la base no es la de pruebas',
    () => {
      expect(() => correr({ SUPABASE_REF_PRUEBAS: 'otroproyecto' })).toThrow(
        /no es la del proyecto de pruebas/,
      );
    },
    ESPERA_MS,
  );

  it(
    'si falta la clave secreta, dice que variable falta',
    () => {
      expect(avisoDeVariables({ [CLAVE_SECRETA]: '' })).toContain(`${AVISO}: ${CLAVE_SECRETA}.`);
    },
    ESPERA_MS,
  );

  it(
    'si faltan varias variables, las nombra todas en un solo aviso',
    () => {
      const faltantes = ['NEXT_PUBLIC_SUPABASE_URL', 'CONTRASENA_USUARIOS_PRUEBA', CLAVE_SECRETA];
      const aviso = avisoDeVariables(Object.fromEntries(faltantes.map((nombre) => [nombre, ''])));
      for (const nombre of faltantes) expect(aviso).toContain(nombre);
    },
    ESPERA_MS,
  );
});

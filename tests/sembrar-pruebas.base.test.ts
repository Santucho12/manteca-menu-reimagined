import { execSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

// Corre el comando de verdad, en otro proceso: arranca npm y tsx, por eso tarda.
const ESPERA_MS = 60_000;

function correr(variables: Record<string, string> = {}): string {
  return execSync('npm run sembrar:pruebas', {
    encoding: 'utf8',
    stdio: 'pipe',
    env: { ...process.env, ...variables },
  });
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
      const sinClave = { [['SUPABASE', 'SECRET', 'KEY'].join('_')]: '' };
      expect(() => correr(sinClave)).toThrow(/Faltan o están mal estas variables de entorno/);
    },
    ESPERA_MS,
  );
});

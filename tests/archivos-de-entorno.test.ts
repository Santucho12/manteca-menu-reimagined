import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

// Cualquier archivo de entorno puede terminar con la clave secreta adentro.
const ARCHIVOS_DE_ENTORNO = [
  '.env',
  '.env.local',
  '.env.development',
  '.env.development.local',
  '.env.test',
  '.env.test.local',
  '.env.production',
  '.env.production.local',
];

function gitLoIgnora(ruta: string): boolean {
  // --no-index mira las reglas del .gitignore aunque el archivo ya este en el repo.
  try {
    execFileSync('git', ['check-ignore', '--quiet', '--no-index', ruta], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

describe('archivos de entorno en git', () => {
  it.each(ARCHIVOS_DE_ENTORNO)('git ignora %s', (ruta) => {
    expect(gitLoIgnora(ruta)).toBe(true);
  });

  it('git sigue .env.example, que no tiene valores', () => {
    expect(gitLoIgnora('.env.example')).toBe(false);
  });
});

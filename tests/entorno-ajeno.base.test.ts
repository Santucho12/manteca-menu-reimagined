import { execSync } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import { expect, it } from 'vitest';

// Un archivo de entorno que la preparacion no mira. Si su URL llegara a los tests, la
// comprobacion aprobaria una base y los tests sembrarian y limpiarian en otra.
const ARCHIVO_AJENO = '.env.test.local';
// Dominio reservado que nunca resuelve: aunque algo fallara, no sale nada a otra base.
const URL_AJENA = 'https://otroproyecto.invalid';
const ESPERA_MS = 120_000;

function entornoDeTerminalNueva(): NodeJS.ProcessEnv {
  // Sin lo que cargo esta corrida, como si alguien abriera otra terminal.
  const deEstaCorrida = /SUPABASE|CONTRASENA|^VITEST|^NODE_ENV$|^TEST$/;
  return Object.fromEntries(
    Object.entries(process.env).filter(([nombre]) => !deEstaCorrida.test(nombre)),
  );
}

function correrLaSonda(): string {
  const salida = execSync('npx vitest run --project base tests/sonda-de-entorno.base.test.ts', {
    encoding: 'utf8',
    stdio: 'pipe',
    env: entornoDeTerminalNueva(),
  });
  return salida.replace(/\x1b\[[0-9;]*m/g, '');
}

it(
  'un .env.test.local con otra base no llega a los tests',
  () => {
    // wx: si el archivo ya existe es de alguien, y no se pisa ni se borra.
    writeFileSync(ARCHIVO_AJENO, `NEXT_PUBLIC_SUPABASE_URL=${URL_AJENA}\n`, { flag: 'wx' });
    try {
      expect(correrLaSonda()).toMatch(/Tests\s+1 passed/);
    } finally {
      rmSync(ARCHIVO_AJENO);
    }
  },
  ESPERA_MS,
);

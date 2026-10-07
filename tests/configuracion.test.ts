import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import * as prettier from 'prettier';
import { describe, expect, it } from 'vitest';
import configuracionDeVitest from '../vitest.config';

type Grupo = { test: { name: string; include: string[]; exclude: string[] } };

const grupos = (configuracionDeVitest.test?.projects ?? []) as unknown as Grupo[];

function gruposQueLoCorren(archivo: string): string[] {
  return grupos
    .filter(({ test }) => test.include.some((patron) => path.matchesGlob(archivo, patron)))
    .filter(({ test }) => !test.exclude.some((patron) => path.matchesGlob(archivo, patron)))
    .map(({ test }) => test.name);
}

async function reglasQueSaltan(codigo: string, archivo: string): Promise<string[]> {
  const [resultado] = await new ESLint().lintText(codigo, { filePath: archivo });
  return (resultado?.messages ?? []).map((mensaje) => mensaje.ruleId ?? '');
}

describe('grupos de Vitest', () => {
  // Un test que no entra en ningun grupo no corre nunca, y nadie se entera.
  it.each([
    ['src/lib/x.test.ts', 'puros'],
    ['src/lib/x.base.test.ts', 'base'],
    ['tests/x.test.ts', 'puros'],
    ['tests/x.base.test.ts', 'base'],
    ['scripts/x.test.ts', 'puros'],
    ['scripts/x.base.test.ts', 'base'],
  ])('%s corre solo en el grupo %s', (archivo, grupo) => {
    expect(gruposQueLoCorren(archivo)).toEqual([grupo]);
  });
});

describe('version de Node', () => {
  it('package.json declara la version de Node con la que corre el proyecto', () => {
    const paquete = JSON.parse(readFileSync('package.json', 'utf8')) as {
      engines?: { node?: string };
    };
    const mayor = process.versions.node.split('.')[0];
    expect(paquete.engines?.node).toBe(`${mayor}.x`);
  });
});

describe('formato', () => {
  it('Prettier no revisa los tipos que genera Supabase', async () => {
    const info = await prettier.getFileInfo('src/lib/supabase/tipos.ts', {
      ignorePath: '.prettierignore',
    });
    expect(info.ignored).toBe(true);
  });
});

describe('clave secreta en los componentes', () => {
  // Next.js no copia la clave al navegador, pero el error aparecería recien ahi.
  it.each([
    ["import { crearClienteSecreto } from '@/lib/supabase/secreto';", 'src/app/prueba.tsx'],
    [
      "import { crearClienteSecreto } from '../../lib/supabase/secreto';",
      'src/components/guia/prueba.tsx',
    ],
  ])(
    'el lint rechaza %s en un componente',
    async (importacion, archivo) => {
      const reglas = await reglasQueSaltan(
        `${importacion}\nexport { crearClienteSecreto };\n`,
        archivo,
      );
      expect(reglas).toContain('no-restricted-imports');
    },
    30_000,
  );
});

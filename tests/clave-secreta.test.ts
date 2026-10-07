import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// La clave secreta saltea RLS: sale de un unico modulo (CLAUDE.md, "Datos y seguridad").
const UNICO_MODULO = 'src/lib/supabase/secreto.ts';
const NOMBRE_DE_LA_VARIABLE = ['SUPABASE', 'SECRET', 'KEY'].join('_');
const ES_CODIGO = /\.(ts|tsx|mjs|js|cjs)$/;

function archivosDeCodigo(carpeta: string): string[] {
  return readdirSync(carpeta, { withFileTypes: true, recursive: true })
    .filter((entrada) => entrada.isFile() && ES_CODIGO.test(entrada.name))
    .map((entrada) => path.join(entrada.parentPath, entrada.name).replaceAll('\\', '/'));
}

// La raiz se mira sin entrar a sus carpetas: ahi estan las configuraciones. Una opcion env
// en next.config.ts, por ejemplo, copiaria la clave al codigo del navegador.
function configuracionesDeLaRaiz(): string[] {
  return readdirSync('.', { withFileTypes: true })
    .filter((entrada) => entrada.isFile() && ES_CODIGO.test(entrada.name))
    .map((entrada) => entrada.name);
}

describe('clave secreta de Supabase', () => {
  it('en todo el codigo del proyecto solo la nombra su unico modulo', () => {
    const archivos = [
      ...['src', 'scripts', 'tests', 'e2e'].flatMap(archivosDeCodigo),
      ...configuracionesDeLaRaiz(),
    ];
    const queLaNombran = archivos.filter((archivo) =>
      readFileSync(archivo, 'utf8').includes(NOMBRE_DE_LA_VARIABLE),
    );
    expect(queLaNombran).toEqual([UNICO_MODULO]);
  });
});

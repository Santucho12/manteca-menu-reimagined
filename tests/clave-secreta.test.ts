import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// La clave secreta saltea RLS: sale de un unico modulo (CLAUDE.md, "Datos y seguridad").
const UNICO_MODULO = 'src/lib/supabase/secreto.ts';
const NOMBRE_DE_LA_VARIABLE = ['SUPABASE', 'SECRET', 'KEY'].join('_');

function archivosDeCodigo(carpeta: string): string[] {
  return readdirSync(carpeta, { withFileTypes: true, recursive: true })
    .filter((entrada) => entrada.isFile() && /\.(ts|tsx|mjs)$/.test(entrada.name))
    .map((entrada) => path.join(entrada.parentPath, entrada.name).replaceAll('\\', '/'));
}

describe('clave secreta de Supabase', () => {
  it('en el codigo de la aplicacion solo la nombra su unico modulo', () => {
    const queLaNombran = [...archivosDeCodigo('src'), ...archivosDeCodigo('scripts')].filter(
      (archivo) => readFileSync(archivo, 'utf8').includes(NOMBRE_DE_LA_VARIABLE),
    );
    expect(queLaNombran).toEqual([UNICO_MODULO]);
  });
});

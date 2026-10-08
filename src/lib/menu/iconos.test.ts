import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ICONOS } from './iconos';

describe('ICONOS', () => {
  it('son los mismos que acepta la base', () => {
    const migracion = readFileSync('supabase/migrations/20261008120000_menu_tablas.sql', 'utf8');
    const lista = migracion.match(/icono in \(([^)]*)\)/s)?.[1] ?? '';
    const enLaBase = [...lista.matchAll(/'([^']+)'/g)].map((m) => m[1]);
    expect(enLaBase).toEqual([...ICONOS]);
  });

  it('incluye los seis de la pagina de hoy', () => {
    expect(ICONOS).toEqual(expect.arrayContaining(['🥐', '🧈', '🍞', '🥨', '☕', '➕']));
  });
});

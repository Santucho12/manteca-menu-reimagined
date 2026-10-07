import { describe, expect, it } from 'vitest';
import { leerEntornoPublico } from '../src/lib/entorno/publico';
import { leerEntornoPruebas } from './entorno-pruebas';

describe('variables de entorno publicas', () => {
  it('leerEntornoPublico devuelve la URL del proyecto de pruebas', () => {
    const { SUPABASE_REF_PRUEBAS } = leerEntornoPruebas();
    expect(leerEntornoPublico().NEXT_PUBLIC_SUPABASE_URL).toBe(
      `https://${SUPABASE_REF_PRUEBAS}.supabase.co`,
    );
  });

  it('leerEntornoPublico devuelve la clave publicable', () => {
    const clave = leerEntornoPublico().NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    expect(clave.length > 0).toBe(true);
  });

  it('no trae ninguna otra variable', () => {
    expect(Object.keys(leerEntornoPublico()).sort()).toEqual([
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      'NEXT_PUBLIC_SUPABASE_URL',
    ]);
  });
});

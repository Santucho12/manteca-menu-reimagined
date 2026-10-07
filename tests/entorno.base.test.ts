import { describe, expect, it } from 'vitest';
import { leerEntornoPublico } from '../src/lib/entorno/publico';
import { leerEntornoServidor } from '../src/lib/entorno/servidor';
import { leerEntornoPruebas } from './entorno-pruebas';

// Las comparaciones de claves se hacen sobre booleanos para que, si un caso
// falla, la salida del test no muestre ninguna clave.
describe('lectores de variables de entorno', () => {
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

  it('leerEntornoServidor devuelve la clave secreta, que no es la publicable', () => {
    const secreta = leerEntornoServidor().SUPABASE_SECRET_KEY;
    const publicable = leerEntornoPublico().NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    expect(secreta.length > 0).toBe(true);
    expect(secreta === publicable).toBe(false);
  });

  it('las variables publicas no incluyen la clave secreta', () => {
    expect(Object.keys(leerEntornoPublico()).sort()).toEqual([
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      'NEXT_PUBLIC_SUPABASE_URL',
    ]);
  });
});

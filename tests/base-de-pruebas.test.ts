import { describe, expect, it } from 'vitest';
import { esBaseDePruebas, exigirBaseDePruebas } from './base-de-pruebas';

const REF = 'abcdefghijklmnopqrst';

describe('esBaseDePruebas', () => {
  it('acepta la URL del proyecto de pruebas', () => {
    expect(esBaseDePruebas(`https://${REF}.supabase.co`, REF)).toBe(true);
  });

  it('rechaza la URL de otro proyecto', () => {
    expect(esBaseDePruebas('https://zyxwvutsrqponmlkjihg.supabase.co', REF)).toBe(false);
  });

  it('rechaza un dominio que solo empieza igual', () => {
    expect(esBaseDePruebas(`https://${REF}.supabase.co.otro.com`, REF)).toBe(false);
  });

  it('rechaza una URL que solo contiene el identificador', () => {
    expect(esBaseDePruebas(`https://otro.supabase.co/${REF}`, REF)).toBe(false);
  });

  it('rechaza si el identificador esta vacio', () => {
    expect(esBaseDePruebas('https://.supabase.co', '')).toBe(false);
  });

  it('rechaza la URL sin cifrar, que mandaria la clave secreta a la vista', () => {
    expect(esBaseDePruebas(`http://${REF}.supabase.co`, REF)).toBe(false);
  });

  it('rechaza algo que no es una URL', () => {
    expect(esBaseDePruebas('no es una url', REF)).toBe(false);
  });
});

describe('exigirBaseDePruebas', () => {
  it('no hace nada si la base es la de pruebas', () => {
    expect(() => exigirBaseDePruebas(`https://${REF}.supabase.co`, REF)).not.toThrow();
  });

  it('aborta y dice por que si no lo es', () => {
    expect(() => exigirBaseDePruebas('https://otro.supabase.co', REF)).toThrow(
      'no es la del proyecto de pruebas',
    );
  });
});

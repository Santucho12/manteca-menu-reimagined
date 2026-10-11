import { describe, expect, it } from 'vitest';
import { paginaDe } from './paginas';

describe('paginaDe', () => {
  const filas = Array.from({ length: 120 }, (_, i) => i);

  it('corta de a 50 y recorta una pagina que no existe', () => {
    expect(paginaDe(filas, 2)).toEqual({ filas: filas.slice(50, 100), pagina: 2, paginas: 3 });
    expect(paginaDe(filas, 9).pagina).toBe(3);
    expect(paginaDe([], 1)).toEqual({ filas: [], pagina: 1, paginas: 1 });
  });
});

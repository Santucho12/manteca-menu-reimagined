import { describe, expect, it } from 'vitest';
import { moverEnLista } from './orden';

// Los tipos de venta se ordenan a mano (Santiago, 2026-11-20, pedido 102).
describe('moverEnLista', () => {
  const lista = ['a', 'b', 'c', 'd'];

  it('sube y baja un elemento un lugar', () => {
    expect(moverEnLista(lista, 2, -1)).toEqual(['a', 'c', 'b', 'd']);
    expect(moverEnLista(lista, 1, 1)).toEqual(['a', 'c', 'b', 'd']);
  });

  it('en una punta no se mueve más allá', () => {
    expect(moverEnLista(lista, 0, -1)).toEqual(lista);
    expect(moverEnLista(lista, 3, 1)).toEqual(lista);
  });

  it('no cambia la lista que recibe', () => {
    moverEnLista(lista, 0, 1);
    expect(lista).toEqual(['a', 'b', 'c', 'd']);
  });
});

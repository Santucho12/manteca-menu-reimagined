import { describe, expect, it } from 'vitest';
import { camposDelPaso, pasoSiguiente, pasosDelCierre } from './pasosDelCierre';

// Santiago, 2026-11-20: todos los tipos de venta en una sola ventana, sin la cantidad de ventas.
describe('pasosDelCierre', () => {
  it('siempre dos pasos: la caja y después los tipos de venta con el comentario', () => {
    expect(pasosDelCierre()).toEqual([{ tipo: 'caja' }, { tipo: 'final' }]);
    expect(pasosDelCierre()).toEqual([{ tipo: 'caja' }, { tipo: 'final' }]);
  });
});

describe('camposDelPaso', () => {
  it('la caja valida sus montos, los retiros y los gastos, no los controles', () => {
    const campos = camposDelPaso({ tipo: 'caja' }, 2);
    expect(campos).toContain('efectivo');
    expect(campos).toContain('quedaEnCaja');
    expect(campos).toContain('retiros');
    expect(campos).not.toContain('controles.0.total');
    expect(campos).not.toContain('comentario');
  });

  it('el último paso valida lo facturado de cada tipo y el comentario', () => {
    expect(camposDelPaso({ tipo: 'final' }, 2)).toEqual([
      'controles.0.total',
      'controles.1.total',
      'comentario',
    ]);
  });
});

describe('pasoSiguiente', () => {
  it('avanza y vuelve sin salirse de los pasos', () => {
    expect(pasoSiguiente(0, 1, 3)).toBe(1);
    expect(pasoSiguiente(2, 1, 3)).toBe(2);
    expect(pasoSiguiente(0, -1, 3)).toBe(0);
  });
});

import { describe, expect, it } from 'vitest';
import { crearAzar, elegir, entero } from './azar';

describe('crearAzar', () => {
  it('con la misma semilla da los mismos números, entre 0 y 1', () => {
    const uno = crearAzar(89);
    const otro = crearAzar(89);
    const numeros = Array.from({ length: 5 }, () => uno());
    expect(Array.from({ length: 5 }, () => otro())).toEqual(numeros);
    for (const n of numeros) expect(n >= 0 && n < 1).toBe(true);
  });

  it('con otra semilla da otros', () => {
    expect(crearAzar(1)()).not.toBe(crearAzar(2)());
  });
});

describe('entero', () => {
  it('queda entre los dos extremos, incluidos', () => {
    const azar = crearAzar(7);
    const vistos = new Set(Array.from({ length: 200 }, () => entero(azar, 3, 5)));
    expect([...vistos].sort()).toEqual([3, 4, 5]);
  });
});

describe('elegir', () => {
  it('no elige lo que no tiene peso', () => {
    const azar = crearAzar(3);
    const opciones = [
      { valor: 'nunca', peso: 0 },
      { valor: 'siempre', peso: 1 },
    ];
    for (let i = 0; i < 50; i += 1) expect(elegir(azar, opciones)).toBe('siempre');
  });
});

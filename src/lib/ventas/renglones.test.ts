import { describe, expect, it } from 'vitest';
import {
  cantidadDe,
  cantidadParaMostrar,
  subtotalDe,
  totalDe,
  totalEscrito,
} from './renglones';

describe('cantidadDe', () => {
  it.each([
    ['2', 2],
    ['1,5', 1.5],
    ['0,125', 0.125],
    [' 3 ', 3],
  ])('entiende "%s"', (texto, cantidad) => {
    expect(cantidadDe(texto)).toBe(cantidad);
  });

  it.each(['', '0', '0,000', '-1', '1.5', '1,2345', 'dos'])('rechaza "%s"', (texto) => {
    expect(cantidadDe(texto)).toBeUndefined();
  });
});

describe('subtotalDe y totalDe', () => {
  it('redondea cada subtotal a centavos igual que la base', () => {
    expect(subtotalDe(2, 100000)).toBe(200000);
    // 1,5 x $333,33 = 49999,5 centavos: redondea a 50000.
    expect(subtotalDe(1.5, 33333)).toBe(50000);
    expect(subtotalDe(0.125, 1)).toBe(0);
    expect(subtotalDe(1.005, 1000)).toBe(1005);
  });

  it('el total es la suma de los subtotales ya redondeados', () => {
    expect(
      totalDe([
        { cantidad: 2, precioCentavos: 100000 },
        { cantidad: 1.5, precioCentavos: 33333 },
      ]),
    ).toBe(250000);
    expect(totalDe([])).toBe(0);
  });
});

describe('totalEscrito', () => {
  it('suma lo que ya se entiende y deja afuera lo que todavia no', () => {
    expect(
      totalEscrito([
        { cantidad: '2', precio: '1.000' },
        { cantidad: '1,5', precio: '333,33' },
        { cantidad: '', precio: '500' },
        { cantidad: '3', precio: 'abc' },
      ]),
    ).toBe(250000);
  });
});

describe('cantidadParaMostrar', () => {
  it('con coma y sin ceros de mas', () => {
    expect(cantidadParaMostrar(2)).toBe('2');
    expect(cantidadParaMostrar(1.5)).toBe('1,5');
    expect(cantidadParaMostrar(0.125)).toBe('0,125');
  });
});

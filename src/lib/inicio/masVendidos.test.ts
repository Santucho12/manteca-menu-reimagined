import { describe, expect, it } from 'vitest';
import { anchoDeBarra, puestoDeMasVendidos } from './masVendidos';

// Más vendidos rediseñado (Santiago, 2026-11-19, pedido 102): cada producto con una barra que lo
// compara con el primero, y los tres primeros con su medalla dibujada, sin emojis.
describe('el ancho de la barra de cada producto', () => {
  it('el primero llena la barra y los demás van en proporción a él', () => {
    expect(anchoDeBarra(255_100_000, 255_100_000)).toBe(100);
    expect(anchoDeBarra(127_550_000, 255_100_000)).toBe(50);
  });

  it('redondea a un entero y nunca baja de un mínimo que se vea', () => {
    expect(anchoDeBarra(225_700_000, 255_100_000)).toBe(88);
    expect(anchoDeBarra(1, 255_100_000)).toBe(4);
  });

  it('sin un primero con monto, la barra queda vacía', () => {
    expect(anchoDeBarra(0, 0)).toBe(0);
  });
});

describe('el puesto de cada producto', () => {
  it.each([
    [0, 'Medalla de oro', 'fill-amber-300'],
    [1, 'Medalla de plata', 'fill-slate-200'],
    [2, 'Medalla de bronce', 'fill-[#cd7f32]'],
  ])('el puesto %i lleva la %s dibujada, con su cinta y su disco', (posicion, nombre, disco) => {
    const { medalla } = puestoDeMasVendidos(posicion);
    expect(medalla?.nombre).toBe(nombre);
    expect(medalla?.disco).toContain(disco);
  });

  it('el bronce es un cobre tostado, no un naranja', () => {
    expect(JSON.stringify(puestoDeMasVendidos(2).medalla)).not.toContain('orange');
  });

  it('del cuarto en adelante no hay medalla: un círculo gris', () => {
    expect(puestoDeMasVendidos(3).medalla).toBeNull();
    expect(puestoDeMasVendidos(4).circulo).toContain('bg-slate-50');
  });
});

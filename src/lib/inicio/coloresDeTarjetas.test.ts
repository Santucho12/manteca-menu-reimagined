import { describe, expect, it } from 'vitest';
import { colorDeTarjeta } from './coloresDeTarjetas';

// Cada tarjeta de números con su color, como en FiestaCobra (Santiago, 2026-11-19, pedido 101).
describe('el color de cada tarjeta de números', () => {
  it.each([
    ['Ventas', 'emerald'],
    ['Cobrado', 'emerald'],
    ['Gastos', 'rose'],
    ['Anuladas', 'rose'],
    ['Balance', 'blue'],
    ['Ticket promedio', 'amber'],
    ['Canceladas', 'slate'],
  ])('%s va en %s, en la raya y en el ícono', (etiqueta, familia) => {
    const { raya, icono } = colorDeTarjeta(etiqueta);
    expect(raya).toBe(`bg-${familia}-500`);
    expect(icono).toBe(`bg-${familia}-50 text-${familia}-600`);
  });

  it('una tarjeta sin color propio usa el azul de marca', () => {
    expect(colorDeTarjeta('Otra')).toEqual({
      raya: 'bg-primary',
      icono: 'bg-secondary text-primary',
    });
  });
});

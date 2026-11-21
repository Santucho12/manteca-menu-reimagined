import { describe, expect, it } from 'vitest';
import { colorDeTarjeta } from './coloresDeTarjetas';

// Cada tarjeta de números con su color, como en FiestaCobra: el borde y el ícono teñidos, sin
// raya arriba (Santiago, 2026-11-19, pedido 101).
describe('el color de cada tarjeta de números', () => {
  it.each([
    ['Ventas', 'emerald'],
    ['Cobrado', 'emerald'],
    ['Gastos', 'rose'],
    ['Anuladas', 'rose'],
    ['Balance', 'blue'],
    ['Ticket promedio', 'slate'],
    ['Canceladas', 'slate'],
    ['Costo', 'rose'],
    ['Ganancia', 'blue'],
    ['Cantidad de ventas', 'slate'],
  ])('%s va en %s, en el borde, el ícono y el punto', (etiqueta, familia) => {
    const { borde, icono, punto } = colorDeTarjeta(etiqueta);
    expect(borde).toBe(`border-${familia}-100`);
    expect(punto).toBe(`bg-${familia}-600`);
    expect(icono).toBe(`bg-${familia}-50 text-${familia}-600`);
  });

  it('una tarjeta sin color propio usa el gris', () => {
    expect(colorDeTarjeta('Otra')).toEqual({
      borde: 'border-slate-100',
      icono: 'bg-slate-50 text-slate-600',
      punto: 'bg-slate-600',
    });
  });
});

import { describe, expect, it } from 'vitest';
import { detalleDeTarjeta } from './detallesDeTarjetas';

// Al pie de cada tarjeta de Inicio, una descripción mínima en lugar de la variación, como en
// FiestaCobra (Santiago, 2026-11-19, pedido 101).
describe('la descripción al pie de cada tarjeta de Inicio', () => {
  it.each([
    ['Ventas', 'Cobrado del 1 a hoy'],
    ['Gastos', 'Pagado del 1 a hoy'],
    ['Balance', 'Ventas menos gastos'],
    ['Ticket promedio', 'Por venta cobrada'],
  ])('%s dice «%s»', (etiqueta, detalle) => {
    expect(detalleDeTarjeta(etiqueta)).toBe(detalle);
  });

  it('una tarjeta sin descripción no muestra nada', () => {
    expect(detalleDeTarjeta('Otra')).toBe('');
  });
});

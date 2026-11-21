import { describe, expect, it } from 'vitest';
import { colorDelAviso } from './colorDelAviso';
import { colorDeBarra } from './masVendidos';

// Santiago, 2026-11-21: Inicio con más color, como la lista de Ventas.
describe('colorDelAviso', () => {
  it('cada aviso toma el color de la sección a la que lleva', () => {
    expect(colorDelAviso('/admin/caja/control?x=1').nombre).toBe('caja');
    expect(colorDelAviso('/admin/gastos?pagar=1').nombre).toBe('gastos');
    expect(colorDelAviso('/admin/ventas').fondo).toContain('blue');
    expect(colorDelAviso('/admin/usuarios?estado=pendientes').fondo).toContain('teal');
    expect(colorDelAviso('/admin/costos?filtro=debajo').fondo).toContain('blue');
    expect(colorDelAviso('/admin/gastos').fondo).toContain('blue');
    expect(colorDelAviso('/admin/caja').fondo).toContain('teal');
    expect(colorDelAviso('/admin/otra').fondo).toContain('slate');
  });
});

describe('colorDeBarra', () => {
  it('los puestos de Más vendidos alternan azul y verde azulado', () => {
    // Verde y rojo son bien y mal (Santiago, 2026-11-21): los puestos van en otros colores.
    expect(colorDeBarra(0)).toContain('bg-blue-500');
    expect(colorDeBarra(1)).toContain('bg-teal-500');
    for (let i = 0; i < 5; i++)
      expect(colorDeBarra(i)).not.toMatch(/emerald|rose|slate|amber|orange|yellow/);
    expect(colorDeBarra(2)).toBe(colorDeBarra(0));
  });
});

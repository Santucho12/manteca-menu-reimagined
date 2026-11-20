import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COLOR_DE_COMPARACION, COLOR_DE_REPORTE } from './coloresDeGraficos';

// Los gráficos usan varios colores, no solo el azul de marca (Santiago, 2026-11-19, pedido 101).
const css = readFileSync('src/app/admin/panel.css', 'utf8');

describe('los colores de los gráficos de reportes', () => {
  it('lo que entra va en verde y lo que sale en rojo', () => {
    expect(COLOR_DE_REPORTE.ventas).toBe('#10b981');
    expect(COLOR_DE_REPORTE.productos).toBe('#10b981');
    expect(COLOR_DE_REPORTE.gastos).toBe('#f43f5e');
    expect(COLOR_DE_REPORTE.gastosPorPeriodo).toBe('#f43f5e');
  });

  it('categorías, tipos de venta y caja llevan cada uno su color', () => {
    const otros = [COLOR_DE_REPORTE.categorias, COLOR_DE_REPORTE.tipos, COLOR_DE_REPORTE.caja];
    expect(new Set([...otros, '#10b981', '#f43f5e']).size).toBe(5);
  });

  it('ninguno es el azul de marca y todos son de las familias del panel', () => {
    for (const color of [...Object.values(COLOR_DE_REPORTE), COLOR_DE_COMPARACION]) {
      expect(color).not.toBe('#1e40af');
      expect(css).toContain(`: ${color};`);
    }
  });
});

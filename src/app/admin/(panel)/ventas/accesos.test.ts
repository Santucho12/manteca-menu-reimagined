import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Santiago sacó el botón Cargar venta de Ventas (2026-11-20, pedido 102): se vende desde Vender.
describe('los accesos de Ventas', () => {
  const fuente = readFileSync('src/app/admin/(panel)/ventas/page.tsx', 'utf8');

  it('no tiene Cargar venta', () => {
    expect(fuente).not.toContain('Cargar venta');
    expect(fuente).not.toContain('/admin/ventas/nueva');
  });

  it('sigue con Vender y Tipos de venta', () => {
    expect(fuente).toContain('href="/admin/vender"');
    expect(fuente).toContain('href="/admin/ventas/canales"');
  });
});

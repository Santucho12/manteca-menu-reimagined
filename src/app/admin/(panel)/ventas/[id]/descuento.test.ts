import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// El descuento en el detalle y al editar (Santiago, 2026-11-20, pedido 102).
const leer = (ruta: string) => readFileSync(`src/app/admin/(panel)/ventas/[id]/${ruta}`, 'utf8');

describe('el descuento de una venta', () => {
  it('el detalle lo muestra antes del total, con su motivo', () => {
    const partes = leer('PartesDeLaVenta.tsx');
    expect(partes).toContain('venta.descuento_centavos');
    expect(partes).toContain('venta.motivo_descuento');
  });

  it('al editar viene cargado y se puede cambiar', () => {
    const editor = leer('editar/EditorDeVenta.tsx');
    expect(editor).toContain('useDescuento(inicial.descuento)');
    expect(editor).toContain('<Descuento');
    expect(leer('editar/page.tsx')).toContain('descuentoDeLaVenta(venta)');
  });
});

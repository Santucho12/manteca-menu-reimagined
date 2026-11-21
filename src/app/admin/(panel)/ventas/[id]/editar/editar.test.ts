import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Editar una venta: el mismo Vender por pasos, con la venta cargada y el motivo al final (pedido 102).
const leer = (archivo: string) =>
  readFileSync(`src/app/admin/(panel)/ventas/[id]/editar/${archivo}`, 'utf8');

describe('editar una venta', () => {
  it('la página la abren el admin y Caja, con la venta como ticket', () => {
    const pagina = leer('page.tsx');
    expect(pagina).toContain("exigirPaginaYLeer('caja'");
    expect(pagina).toContain('ticketDeLaVenta(');
    expect(pagina).toContain('<EditorDeVenta');
  });

  it('pide el motivo y guarda con la acción de editar', () => {
    const editor = leer('EditorDeVenta.tsx');
    expect(editor).toContain('Motivo del cambio');
    expect(editor).toContain('boton="Guardar cambios"');
    expect(editor).toContain('useGuardar(editarVentaDesdeElPanel');
  });
});

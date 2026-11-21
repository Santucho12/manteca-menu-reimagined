import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Cada forma de venta dice cuánto es, para la docena variada y la venta por peso (pedido 102).
describe('la medida en el formulario de la categoría', () => {
  const forma = readFileSync('src/app/admin/(panel)/menu/categorias/FormaDeVenta.tsx', 'utf8');

  it('elige si va por unidades o por gramos y cuántos', () => {
    expect(forma).toContain('register(`presentaciones.${i}.medida`)');
    expect(forma).toContain('register(`presentaciones.${i}.cantidad`)');
    expect(forma).toContain('<option value="unidades">');
    expect(forma).toContain('<option value="gramos">');
  });

  it('una forma nueva arranca sin medida', () => {
    const editor = readFileSync(
      'src/app/admin/(panel)/menu/categorias/EditorDePresentaciones.tsx',
      'utf8',
    );
    expect(editor).toMatch(/medida: '',\s*cantidad: ''/);
  });
});

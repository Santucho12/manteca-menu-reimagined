import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// En el detalle: Editar al lado de Anular, y "Editada" al lado del estado (pedido 102).
const leer = (ruta: string) => readFileSync(`src/app/admin/(panel)/ventas/${ruta}`, 'utf8');

describe('la venta editada', () => {
  const pagina = leer('[id]/page.tsx');
  const partes = leer('[id]/PartesDeLaVenta.tsx');

  it('el detalle lo abren el admin y Caja; Editar sale si puede editarla', () => {
    expect(pagina).toContain("exigirPaginaYLeer('caja'");
    expect(pagina).toContain('puedeEditar(venta, estado, new Date())');
    expect(pagina).toContain('/editar`');
  });

  it('anular sigue siendo solo del admin', () => {
    expect(pagina).toContain("if (estado !== 'admin') return editar;");
  });

  it('al lado del estado dice Editada, y abajo el motivo y cuándo', () => {
    expect(partes).toContain('Editada');
    expect(partes).toContain('venta.motivo_edicion');
  });

  it('la lista también marca las editadas', () => {
    expect(leer('ListaDeVentas.tsx')).toContain('venta.editada');
  });
});

describe('el descuento en la lista', () => {
  it('debajo del total dice cuánto se descontó', () => {
    const lista = readFileSync('src/app/admin/(panel)/ventas/ListaDeVentas.tsx', 'utf8');
    expect(lista).toContain('venta.descuento_centavos');
    expect(readFileSync('src/lib/ventas/consultas.ts', 'utf8')).toContain(
      'editada, descuento_centavos, descuento_porcentaje, descuento_tipo, total_centavos',
    );
  });
});

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Caja entra a Ventas y ve solo las de los últimos 30 minutos; al cobrar, Vender trae acá con la
// ventana de vuelto (Santiago, 2026-11-20, pedido 102).
const leer = (ruta: string) => readFileSync(`src/app/admin/(panel)/${ruta}`, 'utf8');

describe('Ventas para Caja y al cobrar', () => {
  const pagina = leer('ventas/page.tsx');

  it('la abren el admin y Caja; Caja ve las recientes, sin filtros ni totales', () => {
    expect(pagina).toContain("exigirPaginaYLeer('caja'");
    expect(pagina).toContain('ventasRecientes(');
  });

  it('muestra la ventana de vuelto que manda Vender', () => {
    expect(pagina).toContain('<VueltoDeLaVenta');
  });

  it('Vender lleva a Ventas al cobrar, con el efectivo para el vuelto', () => {
    expect(leer('vender/Mostrador.tsx')).toContain('router.push(destinoAlCobrar(');
  });
});

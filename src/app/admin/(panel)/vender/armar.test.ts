import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Armar las facturas surtidas después de cobrar (Santiago, 2026-11-20, pedido 102).
const leer = (ruta: string) => readFileSync(`src/app/admin/(panel)/${ruta}`, 'utf8');

describe('armar las facturas', () => {
  it('se toca cada factura, cuenta lo que falta y al completar guarda solo', () => {
    const armar = leer('vender/ArmarFacturas.tsx');
    expect(armar).toContain('Armá las facturas');
    expect(armar).toContain('faltanParaArmar(');
    expect(armar).toContain('armadoCompleto(');
    expect(armar).toContain('Armar después');
  });

  it('aparece en la ventana al cobrar, que no se va sola si falta armar', () => {
    expect(leer('vender/VentanaDeVuelto.tsx')).toContain('esperar');
    expect(leer('ventas/page.tsx')).toContain('datosDeLaVentana(');
    expect(leer('ventas/ventanaAlCobrar.ts')).toContain('porArmar(');
  });

  it('Vender muestra lo que quedó por armar', () => {
    expect(leer('vender/page.tsx')).toContain('<PorArmarEnVender');
  });
});

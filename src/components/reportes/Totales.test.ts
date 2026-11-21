import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Los totales de los reportes con la tarjeta de números de Inicio y Ventas (pedido 102 y skill
// estetica-sistema).
const totales = readFileSync('src/components/reportes/Totales.tsx', 'utf8');

describe('las tarjetas de totales de los reportes', () => {
  it('toman el borde y el punto del color de lo que muestran, como en Inicio', () => {
    expect(totales).toContain('colorDeTarjeta(item.etiqueta)');
    expect(totales).toMatch(/rounded-xl border \$\{borde\} bg-white/);
  });

  it('el monto va en Outfit, grande como en Inicio', () => {
    for (const clase of ['font-display', 'text-xl', 'sm:text-2xl', '2xl:text-3xl', 'font-bold'])
      expect(totales).toContain(clase);
  });

  it('la variación va al pie, separada por una línea fina y con el punto', () => {
    expect(totales).toContain('border-t border-slate-100');
    expect(totales).toMatch(/h-1\.5 w-1\.5 shrink-0 rounded-full \$\{punto\}/);
  });
});

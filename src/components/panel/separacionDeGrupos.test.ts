import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Los grupos de la barra, apenas más separados entre sí (Santiago, 2026-11-20, pedido 102).
describe('la separación de los grupos de la barra', () => {
  it('va de 24 px, y de 12 en una pantalla baja', () => {
    const fuente = readFileSync('src/components/panel/BarraLateral.tsx', 'utf8');
    expect(fuente).toContain('space-y-6 [@media(max-height:760px)]:space-y-3');
  });

  it('la lista se desplaza cuando no entra (Santiago, 2026-11-20)', () => {
    const fuente = readFileSync('src/components/panel/BarraLateral.tsx', 'utf8');
    expect(fuente).toContain('overflow-y-auto overscroll-contain');
    expect(fuente).not.toContain('min-h-0 overflow-hidden space-y');
  });

  it('se desplaza sin mostrar la barra de desplazamiento', () => {
    const fuente = readFileSync('src/components/panel/BarraLateral.tsx', 'utf8');
    expect(fuente).toContain('[scrollbar-width:none] [&::-webkit-scrollbar]:hidden');
  });
});

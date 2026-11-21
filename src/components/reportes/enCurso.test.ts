import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// "en curso" del mes a mes va en rojo, el de la regla de color (Santiago, 2026-11-20, pedido 102).
describe('la etiqueta en curso del mes a mes', () => {
  it('va en rojo y no en ámbar', () => {
    const fuente = readFileSync('src/components/reportes/GraficoPorMes.tsx', 'utf8');
    expect(fuente).toContain('fill="#e11d48"');
    expect(fuente).not.toContain('#d97706');
  });
});

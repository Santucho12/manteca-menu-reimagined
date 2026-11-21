import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// El bloque del mes más ancho y «Para atender» más angosto (Santiago, 2026-11-19, pedido 102).
const inicio = readFileSync('src/components/inicio/InicioAdmin.tsx', 'utf8');

describe('la fila del bloque del mes en Inicio', () => {
  it('reparte dos tercios para el bloque y un tercio para Para atender', () => {
    expect(inicio).toContain('grid grid-cols-1 xl:grid-cols-3 gap-8 xl:h-[24rem]');
    expect(inicio).toMatch(/xl:col-span-2">\s*<BloqueDelMes/);
    expect(inicio).toMatch(/xl:col-span-1 min-h-0">\s*<Avisos/);
  });
});

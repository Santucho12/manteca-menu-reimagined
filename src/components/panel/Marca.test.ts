import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// En la barra lateral, el logo más grande y sin "Sistema de gestión" (Santiago, 2026-11-20).
const fuente = readFileSync('src/components/panel/Marca.tsx', 'utf8');
const lateral = /lateral: \{([^}]*)\}/.exec(fuente)?.[1] ?? '';

describe('la marca de la barra lateral', () => {
  it('el logo mide 164 px de ancho', () => {
    expect(lateral).toContain("logo: 'w-[164px]'");
  });

  it('no lleva el lema', () => {
    expect(lateral).toContain('lema: null');
  });
});

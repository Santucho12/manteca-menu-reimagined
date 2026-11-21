import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { tokensDe } from './colores';

// La carta pública con los colores de la pieza de Manteca (Santiago, 2026-11-20, pedido 102):
// fondo hueso, tinta casi negra y el dorado del logo.
const tokens = tokensDe(readFileSync('src/app/globals.css', 'utf8'));

describe('los colores de la carta', () => {
  it.each([
    ['--background', '#f0efeb'],
    ['--foreground', '#1a1a1a'],
    ['--card', '#faf9f6'],
    ['--card-foreground', '#1a1a1a'],
    ['--primary', '#bfa042'],
    ['--primary-foreground', '#1a1a1a'],
    ['--muted-foreground', '#6b6862'],
  ])('%s es %s', (nombre, valor) => {
    expect(tokens.get(nombre)).toBe(valor);
  });
});

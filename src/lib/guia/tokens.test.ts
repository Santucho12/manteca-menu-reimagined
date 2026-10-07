import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COLORES, ESPACIADOS, RADIOS, SOMBRAS, TIPOGRAFIAS } from './tokens';

const css = readFileSync('src/app/globals.css', 'utf8');

function estaDefinida(variable: string): boolean {
  return new RegExp(`${variable}\s*:`).test(css);
}

describe('tokens de la guia de estilos', () => {
  it.each([...COLORES, ...RADIOS, ...SOMBRAS, ...TIPOGRAFIAS])(
    '$nombre usa una variable definida en globals.css',
    ({ variable }) => {
      expect(estaDefinida(variable)).toBe(true);
    },
  );

  it('no repite nombres', () => {
    const nombres = [...COLORES, ...RADIOS, ...SOMBRAS, ...TIPOGRAFIAS].map((t) => t.nombre);
    expect(new Set(nombres).size).toBe(nombres.length);
  });

  it('muestra la paleta completa de Manteca', () => {
    expect(COLORES.map((color) => color.variable)).toEqual([
      '--background',
      '--foreground',
      '--card',
      '--primary',
      '--secondary',
      '--muted',
      '--muted-foreground',
      '--accent',
      '--destructive',
      '--border',
    ]);
  });

  it('los espaciados son pasos enteros de la escala', () => {
    expect(ESPACIADOS).toEqual([1, 2, 3, 4, 6, 8, 12, 16]);
  });
});

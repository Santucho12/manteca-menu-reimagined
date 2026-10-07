import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { contraste, sobreFondo, tokensDe } from './colores';

const tokens = tokensDe(readFileSync('src/app/globals.css', 'utf8'));

function color(nombre: string): string {
  const valor = tokens.get(nombre);
  if (!valor) throw new Error(`globals.css no define ${nombre}`);
  return valor;
}

// Referencia WCAG AA: 4,5 a 1 para leer un texto, 3 a 1 para distinguir un control.
describe('contraste de los colores de la guia', () => {
  it.each([
    ['--foreground', '--background'],
    ['--foreground', '--card'],
    ['--card-foreground', '--card'],
    ['--primary-foreground', '--primary'],
    ['--secondary-foreground', '--secondary'],
    ['--muted-foreground', '--background'],
    ['--muted-foreground', '--card'],
    ['--accent-foreground', '--accent'],
    ['--destructive', '--background'],
    ['--destructive', '--card'],
  ])('el texto %s se lee sobre %s (4,5 a 1)', (texto, fondo) => {
    expect(contraste(color(texto), color(fondo))).toBeGreaterThanOrEqual(4.5);
  });

  it('el texto de error se lee sobre su propio fondo tenue (4,5 a 1)', () => {
    // Los avisos y botones de error pintan el fondo con el mismo rojo al 10 %.
    const tenue = sobreFondo(color('--destructive'), color('--background'), 0.1);
    expect(contraste(color('--destructive'), tenue)).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    ['--ring', '--background'],
    ['--ring', '--card'],
    ['--input', '--background'],
    ['--input', '--card'],
  ])('%s se distingue de %s (3 a 1)', (control, fondo) => {
    expect(contraste(color(control), color(fondo))).toBeGreaterThanOrEqual(3);
  });
});

describe('anillo de foco', () => {
  it('ningun componente lo pinta transparente', () => {
    const carpeta = 'src/components/ui';
    const conAnilloTenue = readdirSync(carpeta).filter((archivo) =>
      readFileSync(path.join(carpeta, archivo), 'utf8').includes('ring-ring/'),
    );
    expect(conAnilloTenue).toEqual([]);
  });
});

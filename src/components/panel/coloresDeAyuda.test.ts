import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { colorDeTema } from './coloresDeAyuda';

// "Cómo funciona" va blanco, como Inicio, y cada tema con su color (Santiago, pedido 102).
describe('los colores de Cómo funciona', () => {
  it('los temas rotan azul, verde, rojo y ámbar', () => {
    expect([0, 1, 2, 3, 4].map((i) => colorDeTema(i).titulo)).toEqual([
      'text-blue-700',
      'text-emerald-700',
      'text-rose-700',
      'text-blue-700',
      'text-blue-700',
    ]);
  });

  it('el punto y la rayita del tema van en su color', () => {
    expect(colorDeTema(1).punto).toBe('bg-emerald-500');
    expect(colorDeTema(2).raya).toBe('bg-rose-500');
  });

  it('los temas van separados por 40 px (Santiago, 2026-11-20)', () => {
    const fuente = readFileSync('src/components/panel/Ayuda.tsx', 'utf8');
    expect(fuente).toContain('p-6 space-y-10 overflow-y-auto');
  });

  it('Entendido va en tinta con letra blanca, no en dorado (Santiago, 2026-11-20)', () => {
    const fuente = readFileSync('src/components/panel/Ayuda.tsx', 'utf8');
    expect(fuente).toContain('w-full h-12 rounded-xl bg-foreground text-white');
    expect(fuente).not.toContain('bg-primary');
  });

  it('la ventana es blanca y usa los colores de cada tema', () => {
    const fuente = readFileSync('src/components/panel/Ayuda.tsx', 'utf8');
    expect(fuente).toContain('colorDeTema(');
    expect(fuente).not.toContain('bg-secondary/20');
    expect(fuente).not.toContain('border-t border-border bg-slate-50');
    expect(fuente).not.toContain('text-primary">');
  });
});

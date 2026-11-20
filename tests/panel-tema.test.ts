import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// El panel con los colores de FiestaCobra y el azul de marca con letra blanca (Santiago,
// 2026-11-19, pedido 101). La carta pública tiene su propio CSS y no entra acá.
const css = readFileSync('src/app/admin/panel.css', 'utf8');

function token(nombre: string): string | undefined {
  return new RegExp(`${nombre}:\\s*([^;]+);`).exec(css)?.[1]?.trim();
}

function archivosDe(carpeta: string): string[] {
  return readdirSync(carpeta).flatMap((nombre) => {
    const ruta = path.join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) return archivosDe(ruta);
    return /\.tsx?$/.test(nombre) && !nombre.endsWith('.test.ts') ? [ruta] : [];
  });
}

const PANEL = [
  'src/app/admin',
  'src/components/caja',
  'src/components/formularios',
  'src/components/inicio',
  'src/components/panel',
  'src/components/reportes',
].flatMap(archivosDe);

describe('los colores del panel', () => {
  it.each([
    ['--color-background', '#f9fafb'],
    ['--color-foreground', '#121b2b'],
    ['--color-card', '#ffffff'],
    ['--color-popover', '#ffffff'],
    ['--color-secondary', '#f0f2f5'],
    ['--color-muted', '#f0f2f5'],
    ['--color-muted-foreground', '#5c6b8a'],
    ['--color-border', '#e0e4eb'],
    ['--color-input', '#e0e4eb'],
    ['--color-primary', '#1e40af'],
    ['--color-primary-foreground', '#ffffff'],
    ['--color-accent', '#1e40af'],
    ['--color-accent-foreground', '#ffffff'],
    ['--color-ring', '#1e40af'],
  ])('%s es %s', (nombre, valor) => {
    expect(token(nombre)).toBe(valor);
  });

  it.each([
    ['slate', '#f8fafc', '#64748b', '#0f172a'],
    ['blue', '#eff6ff', '#3b82f6', '#1e3a8a'],
    ['sky', '#f0f9ff', '#0ea5e9', '#0c4a6e'],
  ])('la familia %s es la de Tailwind 3, fría como en FiestaCobra', (familia, c50, c500, c900) => {
    expect([50, 500, 900].map((tono) => token(`--color-${familia}-${tono}`))).toEqual([
      c50,
      c500,
      c900,
    ]);
  });

  it('no quedan el dorado de texto ni el módulo sin color de marca', () => {
    expect(css).not.toContain('#8a7330');
    expect(css).not.toContain('modulo-sin-dorado');
  });

  it('la skill trae el mismo CSS que el panel', () => {
    expect(readFileSync('.claude/skills/estetica-panel/panel.css', 'utf8')).toBe(css);
  });

  it('ninguna pantalla del panel escribe a mano el dorado ni los tonos cálidos', () => {
    const calidos =
      /bfa042|8a7330|2b1d14|fbf9f3|f4efe5|efe7d6|e6dcc8|d8cdb6|d6b75c|a8862f|a8977a|c9b99a|f6efe1|5a3d1c|2b1a0f|22140b|3a2615|191, ?160, ?66|43, ?29, ?20|modulo-sin-dorado/i;
    expect(PANEL.filter((archivo) => calidos.test(readFileSync(archivo, 'utf8')))).toEqual([]);
  });
});

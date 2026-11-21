import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// La regla de color de Inicio en todo el panel (Santiago, 2026-11-20, pedido 102): verde lo que
// entra, rojo lo que sale o urge, azul el balance y lo activo, gris lo neutro, y ámbar solo para
// avisos. Violeta, celeste y compañía quedan afuera.
function archivosDe(carpeta: string): string[] {
  return readdirSync(carpeta).flatMap((nombre) => {
    const ruta = path.join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) return archivosDe(ruta);
    return /\.tsx?$/.test(nombre) && !nombre.endsWith('.test.ts') ? [ruta] : [];
  });
}

const PANEL = [
  'src/app/admin',
  'src/components/panel',
  'src/components/formularios',
  'src/components/inicio',
  'src/components/reportes',
  'src/components/caja',
].flatMap(archivosDe);

describe('la regla de color del panel', () => {
  it('el bloque del mes de Inicio conserva su azul casi negro y sus grises fríos', () => {
    // Excepción de Santiago (2026-11-20, pedido 102): el bloque vuelve a sus colores de antes.
    const bloque = readFileSync('src/components/inicio/BloqueDelMes.tsx', 'utf8');
    expect(bloque).toContain('bg-[#0F172A] border border-[#1e293b]');
    expect(bloque).not.toMatch(/bg-foreground|slate-/);
  });

  // El violeta se permite para distinguir desde el 2026-11-21 (Santiago); los demás, no.
  it('ninguna pantalla usa celeste, índigo, púrpura ni rosa', () => {
    const fuera =
      /\b(?:bg|text|border|from|to|ring|fill|stroke)-(?:sky|indigo|purple|pink|fuchsia)-/;
    expect(PANEL.filter((archivo) => fuera.test(readFileSync(archivo, 'utf8')))).toEqual([]);
  });

  it('la opción elegida va en el azul de marca', () => {
    const opciones = readFileSync('src/components/formularios/OpcionesQueSeTocan.tsx', 'utf8');
    expect(opciones).toContain("'bg-primary text-primary-foreground border-primary'");
  });
});

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { TARJETA_DE_FORMULARIO, TARJETA_DE_SECCION } from '@/components/panel/estilos';

// Las tarjetas del panel con la forma de las de Inicio (Santiago, 2026-11-20, pedido 102): esquinas
// de 16 px, borde fino y la sombra casi invisible. Las ventanas que flotan siguen con su sombra.
function archivosDe(carpeta: string): string[] {
  return readdirSync(carpeta).flatMap((nombre) => {
    const ruta = path.join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) return archivosDe(ruta);
    return /\.tsx?$/.test(nombre) && !nombre.endsWith('.test.ts') ? [ruta] : [];
  });
}

const VENTANAS = ['Ventana.tsx', 'Ayuda.tsx', 'VentanaDelCierre.tsx'];
const PANEL = ['src/app/admin', 'src/components/panel', 'src/components/caja']
  .flatMap(archivosDe)
  .filter((archivo) => !VENTANAS.includes(path.basename(archivo)));

describe('la forma de las tarjetas del panel', () => {
  it('las tarjetas de sección y de formulario son como las de Inicio', () => {
    for (const tarjeta of [TARJETA_DE_SECCION, TARJETA_DE_FORMULARIO]) {
      expect(tarjeta).toContain('rounded-2xl border border-border shadow-card');
    }
  });

  it('ninguna tarjeta lleva esquinas de 32 px ni sombra fuerte fija', () => {
    const fuera = /rounded-\[2rem\]|border-border\/\d+ shadow-xl/;
    expect(PANEL.filter((archivo) => fuera.test(readFileSync(archivo, 'utf8')))).toEqual([]);
  });

  it('las tarjetas de 24 px con sombra chica pasan a la forma de Inicio', () => {
    const fuera = /rounded-3xl border[^'"`]*shadow-sm shadow-slate-900\/5/;
    expect(PANEL.filter((archivo) => fuera.test(readFileSync(archivo, 'utf8')))).toEqual([]);
  });
});

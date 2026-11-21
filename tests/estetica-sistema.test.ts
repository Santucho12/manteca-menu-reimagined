import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as estilos from '../src/components/panel/estilos';

// Santiago, 2026-11-21: todo el sistema (menos Inicio y el ingreso) con la estética de Ventas e
// Inicio (skill estetica-sistema), y cancelar, eliminar y anular en rojo.
function archivos(carpeta: string): string[] {
  return readdirSync(carpeta).flatMap((nombre) => {
    const ruta = join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) return archivos(ruta);
    return /\.tsx?$/.test(nombre) && !/\.test\.tsx?$/.test(nombre) ? [ruta] : [];
  });
}

describe('la estética del sistema', () => {
  it('cancelar y peligro son rojos', () => {
    expect(estilos.BOTON_CANCELAR).toContain('text-rose-700');
    expect(estilos.BOTON_CANCELAR).toContain('bg-rose-50');
    expect(estilos.BOTON_PELIGRO).toContain('bg-rose-600');
    expect(estilos.BOTON_PELIGRO).toContain('text-white');
    expect(estilos.ICONO_BORRAR).toContain('text-rose-500');
  });

  it('las tarjetas, los filtros y las secciones llevan la sombra de Inicio', () => {
    for (const clase of [
      estilos.TARJETA_DE_SECCION,
      estilos.TARJETA_DE_FORMULARIO,
      estilos.BARRA_AUTOMATICA,
      estilos.BARRA_DE_FILTROS,
    ])
      expect(clase).toContain('shadow-card');
    const css = readFileSync('src/app/admin/panel.css', 'utf8');
    expect(css).toMatch(
      /@utility shadow-card \{\s*box-shadow: 0 10px 30px -12px rgba\(15, 23, 42, 0\.18\);/,
    );
  });

  it('ninguna pantalla usa la sombra chica de antes', () => {
    const viejas = [...archivos('src/app/admin'), ...archivos('src/components')].filter((ruta) =>
      readFileSync(ruta, 'utf8').includes('shadow-[0_2px_10px_-4px'),
    );
    expect(viejas).toEqual([]);
  });
});

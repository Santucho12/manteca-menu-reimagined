import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const PANEL = path.join(import.meta.dirname, '..', 'src', 'app', 'admin', '(panel)');

// Esperar el acceso y recien despues leer con el cliente suma una tanda entera de viaje a la
// base (pedido 73): la pantalla pide sus datos con exigirPaginaYLeer o exigirPaginaConLectura.
const ESPERA_Y_DESPUES_LEE = /const\s*\{[^}]*\bcliente\b[^}]*\}\s*=\s*await\s+exigirPagina\(/;

function paginas(carpeta: string): string[] {
  return readdirSync(carpeta).flatMap((nombre) => {
    const ruta = path.join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) return paginas(ruta);
    return nombre === 'page.tsx' ? [ruta] : [];
  });
}

describe('las pantallas del panel', () => {
  it('ninguna espera el acceso para recién después leer sus datos', () => {
    const lentas = paginas(PANEL)
      .filter((ruta) => ESPERA_Y_DESPUES_LEE.test(readFileSync(ruta, 'utf8')))
      .map((ruta) => path.relative(PANEL, ruta).replaceAll('\\', '/'));
    expect(lentas).toEqual([]);
  });
});

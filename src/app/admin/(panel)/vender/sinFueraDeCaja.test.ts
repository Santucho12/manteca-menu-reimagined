import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Sin el medio Fuera de la caja en Vender ni en el filtro de Ventas (Santiago, 2026-11-20).
describe('sin Fuera de la caja', () => {
  it.each([
    'src/app/admin/(panel)/vender/ElegirMedio.tsx',
    'src/app/admin/(panel)/ventas/FiltrosDeVentas.tsx',
    'src/lib/vender/esquemas.ts',
  ])('%s usa solo los medios de la caja', (ruta) => {
    expect(readFileSync(ruta, 'utf8')).not.toContain('MEDIOS_DE_VENTA');
  });
});

import { Search, House, UtensilsCrossed, CircleDollarSign, Package } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { ICONOS_DEL_PANEL } from './iconos';

// Los eligió Santiago el 2026-11-20 (pedido 102); caja y materia prima, después.
describe('los íconos de la barra', () => {
  it.each([
    ['inicio', House],
    ['caja', CircleDollarSign],
    ['menu', UtensilsCrossed],
    ['auditoria', Search],
    ['materia-prima', Package],
  ] as const)('%s', (clave, icono) => {
    expect(ICONOS_DEL_PANEL[clave]).toBe(icono);
  });
});

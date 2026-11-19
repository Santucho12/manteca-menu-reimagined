import { describe, expect, it } from 'vitest';
import { trabaEnLaRuta } from './dondeTraba';

describe('trabaEnLaRuta', () => {
  it('a Caja la traba en todas sus pantallas salvo Cargar cierre', () => {
    expect(trabaEnLaRuta('caja', '/admin/vender')).toBe(true);
    expect(trabaEnLaRuta('caja', '/admin/caja/mis-cierres')).toBe(true);
    expect(trabaEnLaRuta('caja', '/admin/caja')).toBe(false);
  });

  it('al admin, solo en Vender', () => {
    expect(trabaEnLaRuta('admin', '/admin/vender')).toBe(true);
    expect(trabaEnLaRuta('admin', '/admin/gastos')).toBe(false);
  });

  it('a nadie más', () => {
    expect(trabaEnLaRuta('invitado', '/admin/vender')).toBe(false);
  });
});

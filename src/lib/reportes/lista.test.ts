import { describe, expect, it } from 'vitest';
import { REPORTES } from './lista';

describe('lista de reportes', () => {
  it('tiene los siete reportes con su ruta', () => {
    expect(REPORTES.map((r) => r.ruta)).toEqual([
      '/admin/reportes/ventas',
      '/admin/reportes/productos',
      '/admin/reportes/categorias',
      '/admin/reportes/gastos',
      '/admin/reportes/gastos-por-periodo',
      '/admin/reportes/caja',
      '/admin/reportes/resultado',
    ]);
  });
});

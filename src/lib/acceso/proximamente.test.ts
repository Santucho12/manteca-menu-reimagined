import { describe, expect, it } from 'vitest';
import { esProximamente } from './proximamente';

describe('esProximamente', () => {
  it('Proveedores, Costos, Reportes, Auditoría y Mi cuenta todavía no dejan entrar', () => {
    for (const clave of ['proveedores', 'costos', 'reportes', 'auditoria', 'cuenta']) {
      expect(esProximamente(clave)).toBe(true);
    }
  });

  it('el resto de las secciones sí', () => {
    for (const clave of ['inicio', 'ventas', 'caja', 'gastos', 'menu', 'usuarios', 'cierres']) {
      expect(esProximamente(clave)).toBe(false);
    }
  });
});

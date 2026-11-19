import { describe, expect, it } from 'vitest';
import { esProximamente } from './proximamente';

describe('esProximamente', () => {
  it('Costos todavía no deja entrar', () => {
    expect(esProximamente('costos')).toBe(true);
  });

  it('el resto de las secciones sí, también las ya construidas que estaban bloqueadas', () => {
    const claves = ['inicio', 'ventas', 'caja', 'gastos', 'menu', 'usuarios', 'cierres'];
    for (const clave of [...claves, 'proveedores', 'reportes', 'auditoria', 'cuenta']) {
      expect(esProximamente(clave)).toBe(false);
    }
  });
});

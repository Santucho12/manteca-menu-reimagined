import { describe, expect, it } from 'vitest';
import { esProximamente } from './proximamente';

describe('esProximamente', () => {
  it('ya no queda nada en Próximamente: Costos se construyó (pedido 95)', () => {
    expect(esProximamente('costos')).toBe(false);
  });

  it('el resto de las secciones sí, también las ya construidas que estaban bloqueadas', () => {
    const claves = ['inicio', 'ventas', 'caja', 'gastos', 'menu', 'usuarios', 'cierres'];
    for (const clave of [
      ...claves,
      'proveedores',
      'materia-prima',
      'reportes',
      'auditoria',
      'cuenta',
    ]) {
      expect(esProximamente(clave)).toBe(false);
    }
  });
});

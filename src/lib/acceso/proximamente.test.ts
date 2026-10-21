import { describe, expect, it } from 'vitest';
import { esProximamente } from './proximamente';

describe('esProximamente', () => {
  it.each(['proveedores', 'reportes', 'auditoria', 'cuenta'])('%s todavia no se abre', (clave) =>
    expect(esProximamente(clave)).toBe(true),
  );
  it.each(['inicio', 'menu', 'ventas', 'gastos', 'caja', 'cierres', 'usuarios'])(
    '%s se abre',
    (clave) => expect(esProximamente(clave)).toBe(false),
  );
});

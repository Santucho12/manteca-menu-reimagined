import { describe, expect, it } from 'vitest';
import {
  enlaceDeAuditoria,
  filtrosDeAuditoria,
  opcionesDeAccion,
  opcionesDeModulo,
  tablasDe,
} from './pantalla';

const HOY = '2026-10-09';
const PERSONA = '7a2d2f1b-3c2e-4d2f-8b7c-2a3b4c5d6e7f';

describe('filtrosDeAuditoria', () => {
  it('por defecto, hoy y los seis dias anteriores', () => {
    expect(filtrosDeAuditoria({}, HOY)).toEqual({
      desde: '2026-10-03',
      hasta: '2026-10-09',
      persona: null,
      modulo: null,
      accion: null,
      pagina: 1,
    });
  });

  it('lee persona, el sistema, modulo y accion; ignora lo inventado', () => {
    expect(
      filtrosDeAuditoria({ persona: PERSONA, modulo: 'gastos', accion: 'anulacion' }, HOY),
    ).toMatchObject({ persona: PERSONA, modulo: 'gastos', accion: 'anulacion' });
    expect(filtrosDeAuditoria({ persona: 'sistema' }, HOY).persona).toBe('sistema');
    const raro = filtrosDeAuditoria({ persona: 'x', modulo: 'nada', accion: 'borrado' }, HOY);
    expect([raro.persona, raro.modulo, raro.accion]).toEqual([null, null, null]);
  });
});

describe('enlaceDeAuditoria', () => {
  it('solo con lo que cambio', () => {
    const filtros = { ...filtrosDeAuditoria({}, HOY), modulo: 'caja' as const, pagina: 2 };
    expect(enlaceDeAuditoria(filtros, HOY)).toBe('/admin/auditoria?modulo=caja&pagina=2');
    expect(enlaceDeAuditoria(filtrosDeAuditoria({}, HOY), HOY)).toBe('/admin/auditoria');
  });
});

describe('tablasDe', () => {
  it('las tablas de cada modulo', () => {
    expect(tablasDe('caja')).toEqual([
      'cierres_de_caja',
      'retiros_de_caja',
      'configuracion_de_caja',
    ]);
    expect(tablasDe('menu')).toContain('precios');
    expect(tablasDe('gastos')).toContain('gastos_por_pagar');
    expect(tablasDe('ventas')).toEqual([
      'ventas',
      'renglones_de_venta',
      'pagos_de_venta',
      'canales_de_venta',
    ]);
  });
});

describe('opciones de los filtros', () => {
  it('modulos y acciones, con su nombre', () => {
    expect(opcionesDeModulo()).toContainEqual({ valor: 'gastos', texto: 'Gastos' });
    expect(opcionesDeAccion()).toContainEqual({
      valor: 'reseteo_de_contrasena',
      texto: 'Reseteo de contraseña',
    });
  });
});

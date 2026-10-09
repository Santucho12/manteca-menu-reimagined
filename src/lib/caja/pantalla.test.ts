import { describe, expect, it } from 'vitest';
import { enlaceDeControl, filtrosDeControl, nombreDeEstado, nombreDeMedio } from './pantalla';

const HOY = '2026-10-08';
const PERSONA = '6f1c1e0a-2b1d-4c1e-9a6b-1f2e3d4c5b6a';

describe('filtrosDeControl', () => {
  it('por defecto, el mes en curso, todas las personas y todos los estados', () => {
    expect(filtrosDeControl({}, HOY)).toEqual({
      desde: '2026-10-01',
      hasta: '2026-10-31',
      personaId: null,
      estado: null,
      pagina: 1,
    });
  });

  it('lee persona y estado, e ignora un estado inventado', () => {
    expect(filtrosDeControl({ persona: PERSONA, estado: 'revisado' }, HOY)).toMatchObject({
      personaId: PERSONA,
      estado: 'revisado',
    });
    expect(filtrosDeControl({ estado: 'borrado' }, HOY).estado).toBeNull();
  });
});

describe('enlaceDeControl', () => {
  it('solo con lo que cambio', () => {
    const filtros = { ...filtrosDeControl({}, HOY), estado: 'anulado' as const, pagina: 2 };
    expect(enlaceDeControl(filtros, HOY)).toBe('/admin/caja/control?estado=anulado&pagina=2');
    expect(enlaceDeControl(filtrosDeControl({}, HOY), HOY)).toBe('/admin/caja/control');
  });
});

describe('nombres', () => {
  it('de los estados y los medios', () => {
    expect(nombreDeEstado('esperando_ventas')).toBe('Esperando ventas');
    expect(nombreDeEstado('con_diferencia')).toBe('Con diferencia');
    expect(nombreDeMedio('credito')).toBe('Tarjeta de crédito');
  });
});

import { describe, expect, it } from 'vitest';
import {
  enlaceDeControl,
  filtrosDeControl,
  opcionesDeEstado,
  nombreDeEstado,
  nombreDeMedio,
  sinCierresCargados,
  textoDeDiferencia,
  tonoDelCierre,
} from './pantalla';

const HOY = '2026-10-08';
const PERSONA = '6f1c1e0a-2b1d-4c1e-9a6b-1f2e3d4c5b6a';

describe('filtrosDeControl', () => {
  it('por defecto, la última semana, todas las personas y todos los estados', () => {
    expect(filtrosDeControl({}, HOY)).toEqual({
      desde: '2026-10-02',
      hasta: '2026-10-08',
      personaId: null,
      estado: null,
      anulados: false,
      pagina: 1,
    });
  });

  it('lee persona y estado, e ignora un estado inventado', () => {
    expect(
      filtrosDeControl({ persona: PERSONA, estado: 'pendiente', anulados: '1' }, HOY),
    ).toMatchObject({
      personaId: PERSONA,
      estado: 'pendiente',
      anulados: true,
    });
    expect(filtrosDeControl({ estado: 'revisado' }, HOY).estado).toBeNull();
  });

  it('lee el estado "no abrió"', () => {
    expect(filtrosDeControl({ estado: 'no_abrio' }, HOY).estado).toBe('no_abrio');
  });
});

describe('enlaceDeControl', () => {
  it('solo con lo que cambio', () => {
    const filtros = {
      ...filtrosDeControl({}, HOY),
      estado: 'cierra' as const,
      anulados: true,
      pagina: 2,
    };
    expect(enlaceDeControl(filtros, HOY)).toBe(
      '/admin/caja/control?estado=cierra&anulados=1&pagina=2',
    );
    expect(enlaceDeControl(filtrosDeControl({}, HOY), HOY)).toBe('/admin/caja/control');
  });
});

describe('nombres', () => {
  it('de los estados y los medios', () => {
    expect(nombreDeEstado('pendiente')).toBe('Pendiente');
    expect(nombreDeEstado('cierra')).toBe('Cierra');
    expect(nombreDeEstado('con_diferencia')).toBe('Con diferencia');
    expect(nombreDeEstado('no_abrio')).toBe('No abrió');
    expect(nombreDeMedio('credito')).toBe('Tarjeta de crédito');
  });
});

describe('opcionesDeEstado', () => {
  it('son cuatro: cierra, con diferencia, pendiente y no abrió (sin esperar ventas)', () => {
    expect(opcionesDeEstado().map((o) => o.valor)).toEqual([
      'cierra',
      'con_diferencia',
      'pendiente',
      'no_abrio',
    ]);
  });
});

describe('sinCierresCargados', () => {
  it('los dias pendientes y los que no abrio no son cierres: solo se listan sus dias', () => {
    expect(sinCierresCargados('pendiente')).toBe(true);
    expect(sinCierresCargados('no_abrio')).toBe(true);
    expect(sinCierresCargados('cierra')).toBe(false);
    expect(sinCierresCargados(null)).toBe(false);
  });
});

describe('textoDeDiferencia', () => {
  it.each([
    [null, '—'],
    [0, 'Sin diferencia'],
    [-100000, 'Faltan $1.000,00'],
    [5050, 'Sobran $50,50'],
  ])('%s se lee "%s"', (centavos, texto) => {
    expect(textoDeDiferencia(centavos)).toBe(texto);
  });
});

describe('tonoDelCierre', () => {
  it.each([
    [{ estado: 'cierra', anulado: false }, 'esmeralda'],
    [{ estado: 'con_diferencia', anulado: false }, 'rosa'],
    [{ estado: 'pendiente', anulado: false }, 'ambar'],
    [{ estado: 'no_abrio', anulado: false }, 'pizarra'],
    [{ estado: 'cierra', anulado: true }, 'pizarra'],
  ] as const)('%j se pinta %s', (cierre, tono) => {
    expect(tonoDelCierre(cierre)).toBe(tono);
  });
});

describe('el control arranca en la última semana (Santiago, 2026-11-20)', () => {
  it('sin fechas: de hace 6 días a hoy, y el enlace no las repite', async () => {
    const { filtrosDeControl, enlaceDeControl } = await import('./pantalla');
    const filtros = filtrosDeControl({}, '2026-11-20');
    expect([filtros.desde, filtros.hasta]).toEqual(['2026-11-14', '2026-11-20']);
    expect(enlaceDeControl(filtros, '2026-11-20')).toBe('/admin/caja/control');
  });
});

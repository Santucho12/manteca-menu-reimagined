import { describe, expect, it } from 'vitest';
import {
  enlaceDeControl,
  filtrosDeControl,
  mediosDelCierre,
  nombreDeEstado,
  nombreDeMedio,
  textoDeDiferencia,
} from './pantalla';

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

const cierre = {
  efectivo_centavos: 2500050,
  credito_centavos: 300000,
  debito_centavos: 0,
  qr_centavos: 0,
  transferencia_centavos: 150000,
  esperado_efectivo_centavos: null,
  esperado_credito_centavos: null,
  esperado_debito_centavos: null,
  esperado_qr_centavos: null,
  esperado_transferencia_centavos: null,
};

describe('mediosDelCierre', () => {
  it('sin ventas, solo lo declarado', () => {
    expect(mediosDelCierre(cierre)[0]).toEqual({
      medio: 'efectivo',
      declaradoCentavos: 2500050,
      esperadoCentavos: null,
      diferenciaCentavos: null,
    });
    expect(mediosDelCierre(cierre)).toHaveLength(5);
  });

  it('con lo esperado, la diferencia de cada medio', () => {
    const conVentas = {
      ...cierre,
      esperado_efectivo_centavos: 2600050,
      esperado_credito_centavos: 300000,
    };
    expect(mediosDelCierre(conVentas)[0]).toMatchObject({ diferenciaCentavos: -100000 });
    expect(mediosDelCierre(conVentas)[1]).toMatchObject({ diferenciaCentavos: 0 });
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

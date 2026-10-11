import { describe, expect, it } from 'vitest';
import {
  enlaceDeVentas,
  estadoDeVenta,
  filtrosDeVentas,
  lineasDelResumen,
  nombreDeOrigen,
} from './pantalla';

const HOY = '2026-10-10';

describe('filtrosDeVentas', () => {
  it('por defecto, el mes en curso y todo', () => {
    expect(filtrosDeVentas({}, HOY)).toEqual({
      desde: '2026-10-01',
      hasta: '2026-10-31',
      origen: null,
      medio: null,
      estado: null,
      pagina: 1,
    });
  });

  it('lee origen, medio y estado; ignora lo inventado', () => {
    expect(
      filtrosDeVentas({ origen: 'manual', medio: 'qr', estado: 'anulada' }, HOY),
    ).toMatchObject({ origen: 'manual', medio: 'qr', estado: 'anulada' });
    const raro = filtrosDeVentas({ origen: 'web', medio: 'cheque', estado: 'borrada' }, HOY);
    expect([raro.origen, raro.medio, raro.estado]).toEqual([null, null, null]);
  });
});

describe('enlaceDeVentas', () => {
  it('solo con lo que cambio', () => {
    const filtros = { ...filtrosDeVentas({}, HOY), medio: 'efectivo' as const, pagina: 2 };
    expect(enlaceDeVentas(filtros, HOY)).toBe('/admin/ventas?medio=efectivo&pagina=2');
    expect(enlaceDeVentas(filtrosDeVentas({}, HOY), HOY)).toBe('/admin/ventas');
  });
});

describe('nombres', () => {
  it('del origen y del estado, con lo anulado primero', () => {
    expect(nombreDeOrigen('manual')).toBe('A mano');
    expect(nombreDeOrigen('fudo')).toBe('Fudo');
    expect(estadoDeVenta({ estado: 'cerrada', anulado: true })).toBe('Anulada');
    expect(estadoDeVenta({ estado: 'cancelada', anulado: false })).toBe('Cancelada');
    expect(estadoDeVenta({ estado: 'en_curso', anulado: false })).toBe('En curso');
  });
});

describe('lineasDelResumen', () => {
  const totales = {
    cobradoCentavos: 600000,
    cobradas: 2,
    canceladoCentavos: 100000,
    canceladas: 1,
    anuladoCentavos: 300000,
    anuladas: 1,
  };

  it('sin estado elegido, lo cobrado y aparte lo cancelado', () => {
    expect(lineasDelResumen(totales, null)).toEqual([
      'Cobrado: $6.000,00 en 2 ventas',
      'Canceladas: $1.000,00 en 1 venta',
    ]);
    expect(lineasDelResumen({ ...totales, canceladas: 0 }, null)).toEqual([
      'Cobrado: $6.000,00 en 2 ventas',
    ]);
  });

  it('con un estado, el total de lo que se ve', () => {
    expect(lineasDelResumen(totales, 'cerrada')).toEqual(['Cobrado: $6.000,00 en 2 ventas']);
    expect(lineasDelResumen(totales, 'cancelada')).toEqual(['Canceladas: $1.000,00 en 1 venta']);
    expect(lineasDelResumen(totales, 'anulada')).toEqual(['Anuladas: $3.000,00 en 1 venta']);
  });
});

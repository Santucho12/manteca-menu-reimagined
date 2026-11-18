import { describe, expect, it } from 'vitest';
import {
  enlaceDeVentas,
  estadoDeVenta,
  filtrosDeVentas,
  horaDeVenta,
  nombreDeOrigen,
  tarjetasDelResumen,
  tonoDeEstado,
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
    expect(filtrosDeVentas({ origen: 'mostrador' }, HOY).origen).toBe('mostrador');
    const raro = filtrosDeVentas({ origen: 'web', medio: 'cheque', estado: 'borrada' }, HOY);
    expect([raro.origen, raro.medio, raro.estado]).toEqual([null, null, null]);
  });

  it('sin Fudo, ni su origen ni sus canceladas son un filtro', () => {
    const viejo = filtrosDeVentas({ origen: 'fudo', estado: 'cancelada' }, HOY);
    expect([viejo.origen, viejo.estado]).toEqual([null, null]);
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
    expect(nombreDeOrigen('mostrador')).toBe('Mostrador');
    expect(nombreDeOrigen('manual')).toBe('A mano');
    expect(nombreDeOrigen('fudo')).toBe('Fudo');
    expect(estadoDeVenta({ estado: 'cerrada', anulado: true })).toBe('Anulada');
    expect(estadoDeVenta({ estado: 'cancelada', anulado: false })).toBe('Cancelada');
    expect(estadoDeVenta({ estado: 'en_curso', anulado: false })).toBe('En curso');
  });
});

describe('tonoDeEstado', () => {
  it('verde si cuenta, ambar si no se cobro y gris si se anulo', () => {
    expect(tonoDeEstado({ estado: 'cerrada', anulado: false })).toBe('esmeralda');
    expect(tonoDeEstado({ estado: 'cancelada', anulado: false })).toBe('ambar');
    expect(tonoDeEstado({ estado: 'en_curso', anulado: false })).toBe('ambar');
    expect(tonoDeEstado({ estado: 'cerrada', anulado: true })).toBe('pizarra');
  });
});

describe('tarjetasDelResumen', () => {
  const totales = {
    cobradoCentavos: 600000,
    cobradas: 2,
    canceladoCentavos: 100000,
    canceladas: 1,
    anuladoCentavos: 300000,
    anuladas: 1,
  };

  it('tres tarjetas: cobrado, ticket promedio y anuladas (las canceladas eran de Fudo)', () => {
    expect(tarjetasDelResumen(totales)).toEqual([
      { etiqueta: 'Cobrado', valor: '$6.000,00', detalle: '2 ventas' },
      { etiqueta: 'Ticket promedio', valor: '$3.000,00', detalle: 'por venta cobrada' },
      {
        etiqueta: 'Anuladas',
        valor: '$3.000,00',
        detalle: '1 venta',
        ayuda: 'Cargadas por error y anuladas acá, con motivo.',
      },
    ]);
  });

  it('sin ventas cobradas no hay ticket promedio', () => {
    const vacio = { ...totales, cobradoCentavos: 0, cobradas: 0 };
    expect(tarjetasDelResumen(vacio)[1]).toEqual({
      etiqueta: 'Ticket promedio',
      valor: '—',
      detalle: 'sin ventas cobradas',
    });
    expect(tarjetasDelResumen(vacio)[0]!.detalle).toBe('0 ventas');
  });

  it('el ticket promedio se redondea a centavos', () => {
    const t = { ...totales, cobradoCentavos: 1000, cobradas: 3 };
    expect(tarjetasDelResumen(t)[1]!.valor).toBe('$3,33');
  });
});

describe('horaDeVenta', () => {
  it('la hora en Argentina cuando la venta se cerro ese mismo dia', () => {
    expect(horaDeVenta('2026-10-27', '2026-10-27T15:30:00Z')).toBe('12:30');
  });

  it('sin hora conocida no inventa una', () => {
    expect(horaDeVenta('2026-10-27', null)).toBeNull();
  });

  it('si se cargo otro dia, la hora no es la de la venta', () => {
    expect(horaDeVenta('2026-10-20', '2026-10-27T15:30:00Z')).toBeNull();
  });

  it('cuenta el dia en Argentina, no en UTC', () => {
    expect(horaDeVenta('2026-10-26', '2026-10-27T01:15:00Z')).toBe('22:15');
  });
});

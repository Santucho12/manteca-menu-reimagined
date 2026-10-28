import { describe, expect, it } from 'vitest';
import type { FilaDeRecurrente } from './consultas';
import {
  cambiaLaSerie,
  cuandoVence,
  faltaPagarEsteMes,
  proximoPago,
  proximosPagos,
  resumenDeRepeticion,
} from './fijos';

const HOY = '2026-10-27';

const fijo = (primero: string, extra: Partial<FilaDeRecurrente> = {}) => ({
  primer_vencimiento: primero,
  frecuencia: 'mensual' as const,
  generar_desde: null,
  ...extra,
});

const recurrente = (
  id: string,
  primero: string,
  extra: Partial<FilaDeRecurrente> = {},
): FilaDeRecurrente => ({
  id,
  descripcion: null,
  categoria: `Cat ${id}`,
  proveedor: null,
  monto_centavos: 1000,
  medio_de_pago: 'transferencia',
  activo: true,
  ...fijo(primero),
  ...extra,
});

describe('proximoPago', () => {
  it('el primero posterior a hoy: lo de hoy ya está cargado', () => {
    expect(proximoPago(fijo('2026-07-27'), HOY)).toBe('2026-11-27');
    expect(proximoPago(fijo('2026-07-28'), HOY)).toBe('2026-10-28');
  });

  it('respeta desde cuándo se carga', () => {
    expect(proximoPago(fijo('2026-12-10', { generar_desde: '2026-12-10' }), HOY)).toBe(
      '2026-12-10',
    );
    expect(proximoPago(fijo('2026-01-05', { generar_desde: '2027-01-01' }), HOY)).toBe(
      '2027-01-05',
    );
  });

  it('bimestral, anual y el 31', () => {
    expect(proximoPago(fijo('2026-09-15', { frecuencia: 'bimestral' }), HOY)).toBe('2026-11-15');
    expect(proximoPago(fijo('2025-03-01', { frecuencia: 'anual' }), HOY)).toBe('2027-03-01');
    expect(proximoPago(fijo('2026-01-31'), '2026-10-31')).toBe('2026-11-30');
  });
});

describe('cuandoVence', () => {
  it('mañana, en N días hasta 30, y más lejos la fecha entera, con el año', () => {
    expect(cuandoVence('2026-10-28', HOY)).toBe('Mañana');
    expect(cuandoVence('2026-11-05', HOY)).toBe('En 9 días');
    expect(cuandoVence('2026-11-26', HOY)).toBe('En 30 días');
    expect(cuandoVence('2027-07-01', HOY)).toBe('El 01/07/2027');
  });

  it('lo de hoy vence hoy y lo de antes ya venció', () => {
    expect(cuandoVence(HOY, HOY)).toBe('Vence hoy');
    expect(cuandoVence('2026-10-26', HOY)).toBe('Vencido');
    expect(cuandoVence('2025-12-01', HOY)).toBe('Vencido');
  });
});

describe('proximosPagos y faltaPagarEsteMes', () => {
  it('los activos, por fecha y después por nombre', () => {
    const lista = proximosPagos(
      [
        recurrente('b', '2026-11-05'),
        recurrente('a', '2026-11-05'),
        recurrente('c', '2026-10-30'),
        recurrente('d', '2026-10-29', { activo: false }),
      ],
      HOY,
    );
    expect(lista.map((p) => [p.id, p.nombre, p.fecha])).toEqual([
      ['c', 'Cat c', '2026-10-30'],
      ['a', 'Cat a', '2026-11-05'],
      ['b', 'Cat b', '2026-11-05'],
    ]);
  });

  it('suma lo que vence de mañana a fin de mes', () => {
    const lista = proximosPagos(
      [
        recurrente('a', '2026-10-30', { monto_centavos: 500 }),
        recurrente('b', '2026-10-31', { monto_centavos: 250 }),
        recurrente('c', '2026-11-01'),
      ],
      HOY,
    );
    expect(faltaPagarEsteMes(lista, HOY)).toBe(750);
  });

  it('lo que falta pagar este mes incluye lo vencido', () => {
    const items = [
      { fecha: '2026-09-15', montoCentavos: 100 },
      { fecha: '2026-10-30', montoCentavos: 500 },
      { fecha: '2026-11-01', montoCentavos: 999 },
    ];
    expect(faltaPagarEsteMes(items, HOY)).toBe(600);
  });

  it('un vencimiento ya cargado por pagar o pagado antes no se repite: sigue el próximo', () => {
    const fijos = [recurrente('a', '2026-10-30', { medio_de_pago: 'tarjeta' })];
    const [proximo] = proximosPagos(fijos, HOY, new Set(['a|2026-10-30']));
    expect(proximo).toMatchObject({ fecha: '2026-11-30', medio: 'tarjeta' });
  });
});

describe('resumenDeRepeticion', () => {
  const MARCAR = ' Cada pago queda en Próximos pagos hasta que lo marques Pagado.';

  it('con la fecha de hoy y con otra', () => {
    expect(resumenDeRepeticion(HOY, 'mensual', HOY)).toBe(
      `Vence hoy y después todos los meses, el día 27.${MARCAR}`,
    );
    expect(resumenDeRepeticion('2026-11-05', 'bimestral', HOY)).toBe(
      `Vence el 05/11 y después cada dos meses, el día 5.${MARCAR}`,
    );
    expect(resumenDeRepeticion('2026-11-05', 'anual', HOY)).toBe(
      `Vence el 05/11 y después todos los años, el 05/11.${MARCAR}`,
    );
  });

  it('con una fecha pasada, lo de esa fecha a hoy queda por pagar', () => {
    expect(resumenDeRepeticion('2026-07-05', 'mensual', HOY)).toBe(
      `Quedan por pagar los pagos del 05/07 a hoy, y después todos los meses, el día 5.${MARCAR}`,
    );
  });

  it('del 29 al 31 avisa el último día de los meses cortos', () => {
    expect(resumenDeRepeticion('2026-10-31', 'mensual', '2026-10-31')).toBe(
      `Vence hoy y después todos los meses, el día 31. En los meses más cortos, el último día.${MARCAR}`,
    );
  });
});

describe('cambiaLaSerie', () => {
  const actual = fijo('2026-01-31');

  it('no, con el próximo pago y la frecuencia de siempre', () => {
    const enviado = { proximoPago: '2026-10-31', frecuencia: 'mensual' as const };
    expect(cambiaLaSerie(actual, enviado, HOY)).toBe(false);
  });

  it('sí, con otra fecha u otra frecuencia', () => {
    expect(cambiaLaSerie(actual, { proximoPago: '2026-11-02', frecuencia: 'mensual' }, HOY)).toBe(
      true,
    );
    expect(cambiaLaSerie(actual, { proximoPago: '2026-10-31', frecuencia: 'bimestral' }, HOY)).toBe(
      true,
    );
  });
});

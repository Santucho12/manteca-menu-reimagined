import { describe, expect, it } from 'vitest';
import { detalleDelGasto, fechaCorta, marcasDelGasto, nombreDelGasto } from './filas';

const base = {
  descripcion: null,
  categoria: 'Mercadería',
  proveedor: null,
  medio_de_pago: 'transferencia' as const,
};

describe('nombreDelGasto', () => {
  it('la descripción, o la categoría si no tiene', () => {
    expect(nombreDelGasto({ ...base, descripcion: 'Harina' })).toBe('Harina');
    expect(nombreDelGasto(base)).toBe('Mercadería');
  });
});

describe('detalleDelGasto', () => {
  it('la categoría si el nombre es la descripción, el proveedor si tiene y el medio', () => {
    const conTodo = { ...base, descripcion: 'Harina', proveedor: 'Granja El Nido' };
    expect(detalleDelGasto(conTodo)).toBe('Mercadería · Granja El Nido · Transferencia');
    expect(detalleDelGasto(base)).toBe('Transferencia');
  });
});

describe('marcasDelGasto', () => {
  it('fijo con su frecuencia, de caja y anulado', () => {
    expect(marcasDelGasto({ frecuencia: 'mensual', cierre_id: null, anulado: false })).toEqual([
      'Fijo · Todos los meses',
    ]);
    expect(marcasDelGasto({ frecuencia: null, cierre_id: 'c', anulado: true })).toEqual([
      'De caja',
      'Anulado',
    ]);
    expect(marcasDelGasto({ frecuencia: null, cierre_id: null, anulado: false })).toEqual([]);
  });
});

describe('fechaCorta', () => {
  it('el día sin cero y el mes en tres letras', () => {
    expect(fechaCorta('2026-11-05')).toEqual({ dia: '5', mes: 'nov' });
    expect(fechaCorta('2026-01-22')).toEqual({ dia: '22', mes: 'ene' });
  });
});

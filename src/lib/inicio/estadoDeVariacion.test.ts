import { describe, expect, it } from 'vitest';
import { estadoDeVariacion } from './estadoDeVariacion';

const subio = { diferenciaCentavos: 500, porcentaje: 5 };
const bajo = { diferenciaCentavos: -500, porcentaje: -5 };
const igual = { diferenciaCentavos: 0, porcentaje: 0 };

describe('estadoDeVariacion', () => {
  it('en ventas, balance y ticket, subir mejora y bajar empeora', () => {
    for (const etiqueta of ['Ventas', 'Balance', 'Ticket promedio']) {
      expect(estadoDeVariacion(etiqueta, subio)).toBe('mejora');
      expect(estadoDeVariacion(etiqueta, bajo)).toBe('empeora');
    }
  });

  it('en gastos, bajar mejora y subir empeora', () => {
    expect(estadoDeVariacion('Gastos', bajo)).toBe('mejora');
    expect(estadoDeVariacion('Gastos', subio)).toBe('empeora');
  });

  it('sin diferencia queda igual, y sin mes anterior no hay con qué comparar', () => {
    expect(estadoDeVariacion('Ventas', igual)).toBe('igual');
    expect(estadoDeVariacion('Gastos', igual)).toBe('igual');
    expect(estadoDeVariacion('Ventas', null)).toBe('sin-datos');
  });

  it('contra un mes en cero, la diferencia sola alcanza para decidir', () => {
    expect(estadoDeVariacion('Ventas', { diferenciaCentavos: 900, porcentaje: null })).toBe(
      'mejora',
    );
  });
});

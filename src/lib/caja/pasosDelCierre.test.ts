import { describe, expect, it } from 'vitest';
import { camposDelPaso, pasoSiguiente, pasosDelCierre } from './pasosDelCierre';

describe('pasosDelCierre', () => {
  it('sin tipos controlados: la caja y después el comentario', () => {
    expect(pasosDelCierre(0)).toEqual([{ tipo: 'caja' }, { tipo: 'comentario' }]);
  });

  it('con tipos: la caja, una ventana por tipo y al final el comentario', () => {
    expect(pasosDelCierre(2)).toEqual([
      { tipo: 'caja' },
      { tipo: 'control', indice: 0 },
      { tipo: 'control', indice: 1 },
      { tipo: 'comentario' },
    ]);
  });
});

describe('camposDelPaso', () => {
  it('la caja valida sus montos, los retiros y los gastos, no los controles', () => {
    const campos = camposDelPaso({ tipo: 'caja' });
    expect(campos).toContain('efectivo');
    expect(campos).toContain('quedaEnCaja');
    expect(campos).toContain('retiros');
    expect(campos).not.toContain('controles');
    expect(campos).not.toContain('comentario');
  });

  it('un tipo valida solo lo suyo', () => {
    expect(camposDelPaso({ tipo: 'control', indice: 1 })).toEqual([
      'controles.1.total',
      'controles.1.cantidad',
    ]);
  });

  it('el último paso valida el comentario', () => {
    expect(camposDelPaso({ tipo: 'comentario' })).toEqual(['comentario']);
  });
});

describe('pasoSiguiente', () => {
  it('avanza y vuelve sin salirse de los pasos', () => {
    expect(pasoSiguiente(0, 1, 3)).toBe(1);
    expect(pasoSiguiente(2, 1, 3)).toBe(2);
    expect(pasoSiguiente(0, -1, 3)).toBe(0);
  });
});

import { describe, expect, it } from 'vitest';
import { enlaceDeCostos, filtrosDeCostos, vacioDeCostos } from './pantalla';

describe('filtrosDeCostos', () => {
  it('lee el filtro y el orden de la URL, y lo que no entiende vale lo de siempre', () => {
    expect(filtrosDeCostos({ filtro: 'debajo', orden: 'nombre' })).toEqual({
      filtro: 'debajo',
      orden: 'nombre',
    });
    expect(filtrosDeCostos({ filtro: 'otro' })).toEqual({ filtro: 'todos', orden: 'porcentaje' });
  });
});

describe('enlaceDeCostos', () => {
  it('arma la URL solo con lo que cambia', () => {
    expect(enlaceDeCostos({ filtro: 'todos', orden: 'porcentaje' })).toBe('/admin/costos');
    expect(enlaceDeCostos({ filtro: 'sin_receta', orden: 'nombre' })).toBe(
      '/admin/costos?filtro=sin_receta&orden=nombre',
    );
  });
});

describe('vacioDeCostos', () => {
  it('dice por que la lista esta vacia', () => {
    expect(vacioDeCostos('debajo').titulo).toBe('Ningún producto está debajo del mínimo');
    expect(vacioDeCostos('todos').titulo).toBe('Todavía no hay productos en el menú');
  });
});

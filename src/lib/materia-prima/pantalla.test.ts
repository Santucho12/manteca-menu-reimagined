import { describe, expect, it } from 'vitest';
import {
  OPCIONES_DE_UNIDAD,
  enlaceDeInsumos,
  etiquetaDelContenido,
  filtrosDeInsumos,
  textoDeUnidad,
  vacioDeInsumos,
} from './pantalla';

describe('filtrosDeInsumos', () => {
  it('lee la busqueda, los desactivados y la pagina de la URL', () => {
    expect(filtrosDeInsumos({ q: ' harina ', desactivados: '1', pagina: '2' })).toEqual({
      busqueda: 'harina',
      desactivados: true,
      pagina: 2,
    });
  });

  it('sin nada, la primera pagina de los activos', () => {
    expect(filtrosDeInsumos({})).toEqual({ busqueda: null, desactivados: false, pagina: 1 });
  });
});

describe('enlaceDeInsumos', () => {
  it('arma la URL solo con lo que cambia', () => {
    expect(enlaceDeInsumos({ busqueda: null, desactivados: false, pagina: 1 })).toBe(
      '/admin/materia-prima',
    );
    expect(enlaceDeInsumos({ busqueda: 'leche', desactivados: true, pagina: 3 })).toBe(
      '/admin/materia-prima?q=leche&desactivados=1&pagina=3',
    );
  });
});

describe('unidades de uso', () => {
  it('se nombran como en la pantalla', () => {
    expect(textoDeUnidad('g')).toBe('Gramos');
    expect(textoDeUnidad('ml')).toBe('Mililitros');
    expect(textoDeUnidad('unidad')).toBe('Unidades');
    expect(OPCIONES_DE_UNIDAD.map((opcion) => opcion.valor)).toEqual(['g', 'ml', 'unidad']);
  });

  it('el contenido se pide en la unidad del insumo', () => {
    expect(etiquetaDelContenido('g')).toBe('Cuánto trae, en gramos');
    expect(etiquetaDelContenido('unidad')).toBe('Cuánto trae, en unidades');
  });
});

describe('vacioDeInsumos', () => {
  it('dice por que la lista esta vacia', () => {
    const base = { busqueda: null, desactivados: false, pagina: 1 };
    expect(vacioDeInsumos({ ...base, busqueda: 'x' }).titulo).toBe('No se encontraron insumos');
    expect(vacioDeInsumos({ ...base, desactivados: true }).titulo).toBe(
      'No hay insumos desactivados',
    );
    expect(vacioDeInsumos(base).texto).toBe('Cargá el primero con Nuevo insumo.');
  });
});

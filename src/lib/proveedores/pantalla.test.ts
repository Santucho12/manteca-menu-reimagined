import { describe, expect, it } from 'vitest';
import { enlaceDeProveedores, filtrosDeProveedores } from './pantalla';

describe('filtros de la lista de proveedores', () => {
  it('lee la busqueda, el estado y la pagina de la URL', () => {
    expect(filtrosDeProveedores({ q: ' molino ', desactivados: '1', pagina: '2' })).toEqual({
      busqueda: 'molino',
      desactivados: true,
      pagina: 2,
    });
  });

  it('sin parametros: activos, sin busqueda, primera pagina', () => {
    expect(filtrosDeProveedores({})).toEqual({ busqueda: null, desactivados: false, pagina: 1 });
  });

  it('arma el enlace con lo que haga falta', () => {
    expect(enlaceDeProveedores({ busqueda: null, desactivados: false, pagina: 1 })).toBe(
      '/admin/proveedores',
    );
    expect(enlaceDeProveedores({ busqueda: 'harina sur', desactivados: true, pagina: 3 })).toBe(
      '/admin/proveedores?q=harina+sur&desactivados=1&pagina=3',
    );
  });
});

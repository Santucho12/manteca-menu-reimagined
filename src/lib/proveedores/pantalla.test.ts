import { describe, expect, it } from 'vitest';
import {
  enlaceDeProveedores,
  filasConPagado,
  filtrosDeProveedores,
  vacioDeProveedores,
} from './pantalla';

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

describe('filasConPagado', () => {
  const fila = { id: 'p1', nombre: 'Molino', telefono: null, que_compra: null, activo: true };

  it('suma a cada proveedor lo pagado en el mes, o cero si no tiene gastos', () => {
    const filas = [fila, { ...fila, id: 'p2' }];
    const resultado = filasConPagado(filas, new Map([['p1', 300000]]));
    expect(resultado.map((f) => f.pagadoCentavos)).toEqual([300000, 0]);
  });
});

describe('vacioDeProveedores', () => {
  const base = { busqueda: null, desactivados: false, pagina: 1 };

  it('con una busqueda dice que no se encontro nada', () => {
    expect(vacioDeProveedores({ ...base, busqueda: 'x' }).titulo).toBe(
      'No se encontraron proveedores',
    );
  });

  it('sin busqueda distingue los activos de los desactivados', () => {
    expect(vacioDeProveedores(base).titulo).toBe('Todavía no hay proveedores');
    expect(vacioDeProveedores({ ...base, desactivados: true }).titulo).toBe(
      'No hay proveedores desactivados',
    );
  });
});

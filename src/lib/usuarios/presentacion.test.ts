import { describe, expect, it } from 'vitest';
import {
  accionesDisponibles,
  cantidadDePaginas,
  enlaceDeUsuarios,
  estadoDeCuenta,
  filtroDeEstado,
  nombreDeRol,
  numeroDePagina,
  textoDeBusqueda,
  textoDePendientes,
  unValor,
} from './presentacion';

const YO = 'yo';

describe('estado de una cuenta', () => {
  it.each([
    ['invitado', true, 'Pendiente'],
    ['invitado', false, 'Rechazada'],
    ['caja', true, 'Activa'],
    ['admin', false, 'Desactivada'],
  ] as const)('%s con activo %s se ve %s', (rol, activo, estado) => {
    expect(estadoDeCuenta({ id: 'x', rol, activo })).toBe(estado);
  });

  it('nombra los roles', () => {
    expect(nombreDeRol('admin')).toBe('Admin');
  });
});

describe('accionesDisponibles', () => {
  it('sobre la propia cuenta solo se corrigen los datos', () => {
    expect(accionesDisponibles({ id: YO, rol: 'admin', activo: true }, YO)).toEqual(['corregir']);
  });

  it('a quien espera se le da rol o se lo rechaza', () => {
    expect(accionesDisponibles({ id: 'x', rol: 'invitado', activo: true }, YO)).toEqual([
      'darCaja',
      'darAdmin',
      'rechazar',
    ]);
  });

  it('una cuenta desactivada o rechazada solo se reactiva', () => {
    expect(accionesDisponibles({ id: 'x', rol: 'caja', activo: false }, YO)).toEqual(['reactivar']);
  });

  it('a una caja activa se le ofrece pasarla a admin, desactivarla, resetear y corregir', () => {
    expect(accionesDisponibles({ id: 'x', rol: 'caja', activo: true }, YO)).toEqual([
      'darAdmin',
      'desactivar',
      'resetear',
      'corregir',
    ]);
  });

  it('a un admin activo se le ofrece pasarlo a caja', () => {
    expect(accionesDisponibles({ id: 'x', rol: 'admin', activo: true }, YO)[0]).toBe('darCaja');
  });
});

describe('filtros de la lista', () => {
  it.each([
    ['ana', 'ana'],
    ['  ana@manteca.test ', 'ana@manteca.test'],
    ['ana,(%)', 'ana'],
    ['   ', null],
    [undefined, null],
  ])('la busqueda %s queda %s', (texto, esperado) => {
    expect(textoDeBusqueda(texto)).toBe(esperado);
  });

  it.each([
    ['pendientes', 'pendientes'],
    ['cualquiera', 'todos'],
    [undefined, 'todos'],
  ])('el estado %s queda %s', (valor, esperado) => {
    expect(filtroDeEstado(valor)).toBe(esperado);
  });

  it.each([
    ['3', 3],
    ['0', 1],
    ['-2', 1],
    ['2.5', 1],
    ['abc', 1],
    [undefined, 1],
  ])('la pagina %s queda %s', (valor, esperado) => {
    expect(numeroDePagina(valor)).toBe(esperado);
  });

  it('de un parametro repetido toma el primero', () => {
    expect(unValor(['a', 'b'])).toBe('a');
    expect(unValor('a')).toBe('a');
    expect(unValor(undefined)).toBeUndefined();
  });

  it('el enlace omite lo que esta por defecto', () => {
    expect(enlaceDeUsuarios({ busqueda: null, estado: 'todos', pagina: 1 })).toBe(
      '/admin/usuarios',
    );
    expect(enlaceDeUsuarios({ busqueda: 'ana', estado: 'pendientes', pagina: 2 })).toBe(
      '/admin/usuarios?q=ana&estado=pendientes&pagina=2',
    );
  });

  it('cuenta las paginas de a 25', () => {
    expect([0, 25, 26].map(cantidadDePaginas)).toEqual([1, 1, 2]);
  });
});

describe('textoDePendientes', () => {
  it.each([
    [0, 'No hay personas esperando un rol.'],
    [1, 'Hay 1 persona esperando un rol.'],
    [3, 'Hay 3 personas esperando un rol.'],
  ])('con %s pendientes dice %s', (cantidad, texto) => {
    expect(textoDePendientes(cantidad)).toBe(texto);
  });
});

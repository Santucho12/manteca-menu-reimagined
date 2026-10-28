import { describe, expect, it } from 'vitest';
import {
  accionesDisponibles,
  cantidadDePaginas,
  enlaceDeUsuarios,
  estadoDeCuenta,
  filtroDeEstado,
  nombreDeRol,
  numeroDePagina,
  repartirAcciones,
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

  it('a quien espera solo se le da rol', () => {
    expect(accionesDisponibles({ id: 'x', rol: 'invitado', activo: true }, YO)).toEqual([
      'darCaja',
      'darAdmin',
    ]);
  });

  it('una cuenta desactivada o rechazada solo se reactiva', () => {
    expect(accionesDisponibles({ id: 'x', rol: 'caja', activo: false }, YO)).toEqual(['reactivar']);
  });

  it('a una caja activa se le ofrece pasarla a admin o a pendiente, desactivarla, resetear y corregir', () => {
    expect(accionesDisponibles({ id: 'x', rol: 'caja', activo: true }, YO)).toEqual([
      'darAdmin',
      'darPendiente',
      'desactivar',
      'resetear',
      'corregir',
    ]);
  });

  it('a un admin activo se le ofrece pasarlo a caja o a pendiente', () => {
    const acciones = accionesDisponibles({ id: 'x', rol: 'admin', activo: true }, YO);
    expect(acciones.slice(0, 2)).toEqual(['darCaja', 'darPendiente']);
  });
});

describe('repartirAcciones', () => {
  it('el rol va al desplegable, activar o desactivar al interruptor y el resto a botones', () => {
    expect(
      repartirAcciones(['darAdmin', 'darPendiente', 'desactivar', 'resetear', 'corregir']),
    ).toEqual({
      roles: ['darAdmin', 'darPendiente'],
      interruptor: 'desactivar',
      botones: ['resetear', 'corregir'],
    });
  });

  it('una cuenta desactivada solo tiene el interruptor, para reactivarla', () => {
    expect(repartirAcciones(['reactivar'])).toEqual({
      roles: [],
      interruptor: 'reactivar',
      botones: [],
    });
  });

  it('a quien espera: solo el desplegable para el rol, sin interruptor ni botones', () => {
    expect(repartirAcciones(['darCaja', 'darAdmin'])).toEqual({
      roles: ['darCaja', 'darAdmin'],
      interruptor: null,
      botones: [],
    });
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

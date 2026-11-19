import { describe, expect, it } from 'vitest';
import {
  destinoDe,
  enlacesDelPanel,
  estadoDeAcceso,
  requiereSesion,
  type EstadoDeAcceso,
  type Pagina,
  type PerfilDeAcceso,
} from './estados';

const perfil: PerfilDeAcceso = {
  id: 'id',
  nombre: 'Ana',
  email: 'ana@manteca.test',
  rol: 'caja',
  activo: true,
  debe_cambiar_contrasena: false,
};

describe('estadoDeAcceso', () => {
  it('sin perfil no hay sesion', () => {
    expect(estadoDeAcceso(null)).toBe('sin-sesion');
  });

  it('desactivado pesa mas que el rol y que el cambio obligado', () => {
    const desactivado = {
      ...perfil,
      rol: 'admin',
      activo: false,
      debe_cambiar_contrasena: true,
    } as const;
    expect(estadoDeAcceso(desactivado)).toBe('desactivado');
  });

  it('el cambio obligado pesa mas que el rol', () => {
    expect(estadoDeAcceso({ ...perfil, rol: 'admin', debe_cambiar_contrasena: true })).toBe(
      'cambiar-contrasena',
    );
  });

  it.each(['invitado', 'caja', 'encargado', 'admin'] as const)(
    'activo, el estado es el rol %s',
    (rol) => {
      expect(estadoDeAcceso({ ...perfil, rol })).toBe(rol);
    },
  );
});

describe('destinoDe', () => {
  it.each<[EstadoDeAcceso, Pagina, string | null]>([
    ['sin-sesion', 'publica', null],
    ['desactivado', 'publica', null],
    ['admin', 'publica', '/admin'],
    ['cambiar-contrasena', 'publica', '/admin'],
    ['sin-sesion', 'panel', '/admin/ingresar'],
    ['sin-sesion', 'admin', '/admin/ingresar'],
    ['desactivado', 'panel', '/admin/salir?motivo=desactivada'],
    ['desactivado', 'admin', '/admin/salir?motivo=desactivada'],
    ['cambiar-contrasena', 'panel', '/admin/cambiar-contrasena'],
    ['cambiar-contrasena', 'admin', '/admin/cambiar-contrasena'],
    ['cambiar-contrasena', 'cambiar-contrasena', null],
    ['admin', 'cambiar-contrasena', '/admin'],
    ['invitado', 'panel', null],
    ['invitado', 'cuenta', '/admin'],
    ['invitado', 'admin', '/admin'],
    ['encargado', 'cuenta', '/admin'],
    ['caja', 'panel', null],
    ['caja', 'cuenta', null],
    ['caja', 'admin', '/admin'],
    ['caja', 'caja', null],
    ['admin', 'caja', null],
    ['invitado', 'caja', '/admin'],
    ['encargado', 'caja', '/admin'],
    ['admin', 'panel', null],
    ['admin', 'cuenta', null],
    ['admin', 'admin', null],
  ])('%s pidiendo una pagina %s va a %s', (estado, pagina, destino) => {
    expect(destinoDe(estado, pagina)).toBe(destino);
  });
});

describe('requiereSesion', () => {
  it.each<[string, boolean]>([
    ['/admin', true],
    ['/admin/usuarios', true],
    ['/admin/cuenta', true],
    ['/admin/salir', true],
    ['/admin/ingresar', false],
    ['/admin/registro', false],
    ['/', false],
    ['/administracion', false],
  ])('%s exige sesion: %s', (ruta, exige) => {
    expect(requiereSesion(ruta)).toBe(exige);
  });
});

describe('enlacesDelPanel', () => {
  it('el admin ve sus secciones agrupadas: Dia a dia, Plata y Ajustes, y Mi cuenta aparte', () => {
    const enlaces = enlacesDelPanel('admin');
    expect(enlaces.map((enlace) => enlace.texto)).toEqual([
      'Inicio',
      'Ventas',
      'Caja',
      'Gastos',
      'Proveedores',
      'Materia prima',
      'Compras',
      'Costos',
      'Reportes',
      'Menú',
      'Usuarios',
      'Auditoría',
      'Mi cuenta',
    ]);
    expect(enlaces.map((enlace) => enlace.grupo)).toEqual([
      'Día a día',
      'Día a día',
      'Día a día',
      'Plata',
      'Plata',
      'Plata',
      'Plata',
      'Plata',
      'Plata',
      'Ajustes',
      'Ajustes',
      'Ajustes',
      undefined,
    ]);
  });

  it('caja ve Vender primero, después Cargar cierre, Mis cierres y Mi cuenta', () => {
    expect(enlacesDelPanel('caja').map((enlace) => enlace.href)).toEqual([
      '/admin/vender',
      '/admin/caja',
      '/admin/caja/mis-cierres',
      '/admin/cuenta',
    ]);
    expect(enlacesDelPanel('admin').find((enlace) => enlace.clave === 'caja')?.href).toBe(
      '/admin/caja/control',
    );
  });

  it.each(['invitado', 'encargado', 'sin-sesion'] as const)('%s no ve enlaces', (estado) => {
    expect(enlacesDelPanel(estado)).toEqual([]);
  });
});

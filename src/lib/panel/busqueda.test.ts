import { describe, expect, it } from 'vitest';
import { enlaceDeBusqueda } from './busqueda';

describe('enlaceDeBusqueda', () => {
  it('pone el texto en q y conserva los demás filtros', () => {
    expect(enlaceDeBusqueda('/admin/usuarios', { estado: 'activos' }, 'ana')).toBe(
      '/admin/usuarios?estado=activos&q=ana',
    );
  });

  it('recorta los espacios y codifica lo que hace falta', () => {
    expect(enlaceDeBusqueda('/admin/usuarios', {}, '  ana@manteca.test ')).toBe(
      '/admin/usuarios?q=ana%40manteca.test',
    );
  });

  it('con el texto vacío no deja q en la dirección', () => {
    expect(enlaceDeBusqueda('/admin/usuarios', { estado: 'activos' }, '   ')).toBe(
      '/admin/usuarios?estado=activos',
    );
    expect(enlaceDeBusqueda('/admin/usuarios', {}, '')).toBe('/admin/usuarios');
  });

  it('al buscar vuelve a la primera página', () => {
    expect(enlaceDeBusqueda('/admin/usuarios', { pagina: '3' }, 'ana')).toBe(
      '/admin/usuarios?q=ana',
    );
  });
});

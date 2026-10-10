import { describe, expect, it } from 'vitest';
import { enlacesDelMarco } from './marco';

describe('enlacesDelMarco', () => {
  it('al admin, Usuarios le muestra cuantos esperan un rol', () => {
    const enlaces = enlacesDelMarco('admin', 2);
    expect(enlaces.find((enlace) => enlace.clave === 'usuarios')?.insignia).toBe(2);
    expect(enlaces.filter((enlace) => enlace.insignia !== null)).toHaveLength(1);
  });

  it('si nadie espera, ningun enlace lleva numero', () => {
    expect(enlacesDelMarco('admin', 0).map((enlace) => enlace.insignia)).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
  });

  it('caja ve sus tres enlaces, sin numero', () => {
    expect(enlacesDelMarco('caja', 3)).toEqual([
      { clave: 'caja', href: '/admin/caja', texto: 'Cargar cierre', insignia: null },
      { clave: 'cierres', href: '/admin/caja/mis-cierres', texto: 'Mis cierres', insignia: null },
      { clave: 'cuenta', href: '/admin/cuenta', texto: 'Mi cuenta', insignia: null },
    ]);
  });
});

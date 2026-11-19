import { describe, expect, it } from 'vitest';
import { enlacesDelMarco } from './marco';

const NADA = { usuarios: 0, caja: 0, gastos: 0 };
const insigniaDe = (enlaces: ReturnType<typeof enlacesDelMarco>, clave: string) =>
  enlaces.find((enlace) => enlace.clave === clave)?.insignia;

describe('enlacesDelMarco', () => {
  it('al admin, cada seccion con pendientes le muestra cuantos hay', () => {
    const enlaces = enlacesDelMarco('admin', { usuarios: 2, caja: 1, gastos: 3 });
    expect(insigniaDe(enlaces, 'usuarios')).toBe(2);
    expect(insigniaDe(enlaces, 'caja')).toBe(1);
    expect(insigniaDe(enlaces, 'gastos')).toBe(3);
    expect(enlaces.filter((enlace) => enlace.insignia !== null)).toHaveLength(3);
  });

  it('si no hay pendientes, ningun enlace lleva numero', () => {
    expect(enlacesDelMarco('admin', NADA).every((enlace) => enlace.insignia === null)).toBe(true);
  });

  it('caja ve sus cuatro enlaces, sin numero', () => {
    expect(enlacesDelMarco('caja', { usuarios: 3, caja: 2, gastos: 1 })).toEqual([
      { clave: 'vender', href: '/admin/vender', texto: 'Vender', insignia: null },
      { clave: 'caja', href: '/admin/caja', texto: 'Cargar cierre', insignia: null },
      { clave: 'cierres', href: '/admin/caja/mis-cierres', texto: 'Mis cierres', insignia: null },
      { clave: 'cuenta', href: '/admin/cuenta', texto: 'Mi cuenta', insignia: null },
    ]);
  });
});

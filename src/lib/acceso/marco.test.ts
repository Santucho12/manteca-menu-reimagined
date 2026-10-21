import { describe, expect, it } from 'vitest';
import { enlacesDelMarco, gruposDelPanel } from './marco';

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

  it('caja ve sus tres enlaces, sin numero', () => {
    expect(enlacesDelMarco('caja', { usuarios: 3, caja: 2, gastos: 1 })).toEqual([
      { clave: 'caja', href: '/admin/caja', texto: 'Cargar cierre', insignia: null },
      { clave: 'cierres', href: '/admin/caja/mis-cierres', texto: 'Mis cierres', insignia: null },
      { clave: 'cuenta', href: '/admin/cuenta', texto: 'Mi cuenta', insignia: null },
    ]);
  });
});

const claves = (grupos: ReturnType<typeof gruposDelPanel>['grupos']) =>
  grupos.map((grupo) => ({ titulo: grupo.titulo, claves: grupo.enlaces.map((e) => e.clave) }));

describe('gruposDelPanel', () => {
  it('reparte las secciones del admin por momento del dia y deja Mi cuenta al pie', () => {
    const { grupos, pie } = gruposDelPanel(enlacesDelMarco('admin', NADA));
    expect(claves(grupos)).toEqual([
      { titulo: 'Día a día', claves: ['inicio', 'ventas', 'caja'] },
      { titulo: 'Plata', claves: ['gastos', 'proveedores', 'reportes'] },
      { titulo: 'Ajustes', claves: ['menu', 'usuarios', 'auditoria'] },
    ]);
    expect(pie.map((e) => e.clave)).toEqual(['cuenta']);
  });

  it('caja tiene pocas secciones: van juntas, sin titulos, y Mi cuenta al pie', () => {
    const { grupos, pie } = gruposDelPanel(enlacesDelMarco('caja', NADA));
    expect(claves(grupos)).toEqual([{ titulo: null, claves: ['caja', 'cierres'] }]);
    expect(pie.map((e) => e.clave)).toEqual(['cuenta']);
  });

  it('sin enlaces no hay grupos', () => {
    expect(gruposDelPanel([])).toEqual({ grupos: [], pie: [] });
  });
});

import { describe, expect, it } from 'vitest';
import {
  activoEnMas,
  enlaceActivo,
  insigniaDeMas,
  partirEnlaces,
  repartirParaCelular,
} from './navegacion';

const enlaces = [
  { clave: 'inicio', href: '/admin' },
  { clave: 'gastos', href: '/admin/gastos' },
  { clave: 'caja', href: '/admin/caja/control' },
  { clave: 'cuenta', href: '/admin/cuenta' },
];

describe('enlaceActivo', () => {
  it('marca la seccion de una subruta', () => {
    expect(enlaceActivo(enlaces, '/admin/gastos/nuevo')).toBe('gastos');
    expect(enlaceActivo(enlaces, '/admin/gastos')).toBe('gastos');
  });

  it('inicio solo en /admin exacto', () => {
    expect(enlaceActivo(enlaces, '/admin')).toBe('inicio');
    expect(enlaceActivo(enlaces, '/admin/usuarios')).toBeNull();
  });

  it('caja se marca en todas sus pantallas aunque su enlace vaya al control', () => {
    expect(enlaceActivo(enlaces, '/admin/caja/cierres/abc')).toBe('caja');
  });

  it('entre dos enlaces de la misma seccion gana el que coincide entero', () => {
    const deCaja = [
      { clave: 'caja', href: '/admin/caja' },
      { clave: 'cierres', href: '/admin/caja/mis-cierres' },
    ];
    expect(enlaceActivo(deCaja, '/admin/caja/mis-cierres')).toBe('cierres');
    expect(enlaceActivo(deCaja, '/admin/caja')).toBe('caja');
  });
});

describe('repartirParaCelular', () => {
  it('con mas de 5, cuatro abajo y el resto en Mas', () => {
    const muchos = ['inicio', 'menu', 'ventas', 'proveedores', 'gastos', 'caja', 'cuenta'].map(
      (clave) => ({ clave }),
    );
    const { abajo, mas } = repartirParaCelular(muchos);
    expect(abajo.map((e) => e.clave)).toEqual(['inicio', 'ventas', 'gastos', 'caja']);
    expect(mas.map((e) => e.clave)).toEqual(['menu', 'proveedores', 'cuenta']);
  });

  it('con 5 o menos, todos abajo', () => {
    const pocos = ['caja', 'cierres', 'cuenta'].map((clave) => ({ clave }));
    expect(repartirParaCelular(pocos)).toEqual({ abajo: pocos, mas: [] });
  });
});

describe('activoEnMas', () => {
  const mas = [{ clave: 'proveedores' }, { clave: 'usuarios' }];

  it('marca Mas cuando la seccion activa quedo adentro', () => {
    expect(activoEnMas(mas, 'usuarios')).toBe(true);
  });

  it('no lo marca si la activa esta abajo o no hay ninguna', () => {
    expect(activoEnMas(mas, 'gastos')).toBe(false);
    expect(activoEnMas(mas, null)).toBe(false);
  });
});

describe('insigniaDeMas', () => {
  it('suma lo que avisan los enlaces que quedaron en Mas', () => {
    expect(insigniaDeMas([{ insignia: 3 }, { insignia: null }, { insignia: 2 }])).toBe(5);
    expect(insigniaDeMas([{ insignia: null }])).toBeNull();
    expect(insigniaDeMas([])).toBeNull();
  });
});

describe('partirEnlaces', () => {
  const e = (clave: string, grupo?: string) => ({ clave, grupo });

  it('arma los grupos en orden y deja Mi cuenta aparte', () => {
    const partido = partirEnlaces([
      e('inicio', 'A'),
      e('ventas', 'A'),
      e('gastos', 'B'),
      e('cuenta'),
    ]);
    expect(partido.grupos.map((g) => [g.titulo, g.enlaces.map((x) => x.clave)])).toEqual([
      ['A', ['inicio', 'ventas']],
      ['B', ['gastos']],
    ]);
    expect(partido.cuenta?.clave).toBe('cuenta');
  });

  it('sin grupos hay una sola lista sin titulo', () => {
    const partido = partirEnlaces([e('caja'), e('cierres'), e('cuenta')]);
    expect(partido.grupos).toEqual([{ titulo: null, enlaces: [e('caja'), e('cierres')] }]);
    expect(partido.cuenta?.clave).toBe('cuenta');
  });

  it('sin enlaces no hay grupos ni cuenta', () => {
    expect(partirEnlaces([])).toEqual({ grupos: [], cuenta: null });
  });
});

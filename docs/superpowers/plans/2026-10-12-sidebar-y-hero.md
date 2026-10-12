# Sidebar y hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La sidebar y el hero de Plan Reminder Pro en el panel de Manteca, con sus colores y
tipografía, escritos en una skill.

**Architecture:** Lógica pura en `src/lib/acceso/navegacion.ts` (enlace activo y reparto para el
celular). Componentes nuevos en `src/components/panel/` y `MarcoDelPanel` los arma.
`TituloDePagina` toma la estética del hero y suma el subtítulo.

**Tech Stack:** Next.js 16, Tailwind 4, lucide-react, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-12-sidebar-y-hero-design.md`

## Global Constraints

- TDD en la lógica; sin mocks.
- 20 líneas por función en `.ts`, 80 por componente, 300 por archivo. Lógica fuera de `.tsx`.
- Colores de `globals.css` y tipografías del proyecto. Español con voseo.
- Hecho es `npm run verificar` y `npm run e2e` en verde.

## Review Focus

1. Una subruta (`/admin/gastos/nuevo`, `/admin/caja/control`) marca activa su sección; `/admin`
   no queda activo en todas.
2. Caja (3 enlaces) no ve "Más".
3. En el celular nada queda tapado por las barras fijas de arriba y abajo.
4. El invitado (sin enlaces) ve la espera sin sidebar vacía rota.
5. La insignia de Usuarios sigue a la vista, también dentro de "Más".

---

### Task 1: Skill y lógica de navegación

**Files:**
- Create: `.claude/skills/estetica-panel/SKILL.md` y la fila en la tabla de skills de `CLAUDE.md`
- Create: `src/lib/acceso/navegacion.ts`, test `src/lib/acceso/navegacion.test.ts`

**Produces:** `enlaceActivo(enlaces: { clave: string; href: string }[], ruta: string): string | null`;
`repartirParaCelular<T extends { clave: string }>(enlaces: T[]): { abajo: T[]; mas: T[] }`;
`ABAJO_EN_EL_CELULAR = ['inicio', 'ventas', 'gastos', 'caja']`.

- [ ] Test:

```ts
import { describe, expect, it } from 'vitest';
import { enlaceActivo, repartirParaCelular } from './navegacion';

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
```

- [ ] Implementación: la sección de un enlace es su `href` sin la última parte cuando el enlace
  de caja apunta a `/admin/caja/control` (la sección es `/admin/caja`): se usa la base
  `href.split('/').slice(0, 3).join('/')`, salvo `/admin`, que solo coincide exacto.

### Task 2: Marco, sidebar, barras del celular y hero

**Files:** `src/components/panel/{MarcoDelPanel,BarraLateral,BarrasDelCelular,MarcaDelPanel,TituloDePagina}.tsx`, `iconos.ts`.

- [ ] Cada pieza con las clases de la skill. `BarraLateral` y `BarrasDelCelular` son de cliente
  (`usePathname`). La sidebar va `hidden lg:flex`; las barras del celular, `lg:hidden`. Salir
  queda abajo en la sidebar ("Salir", como hoy) y como ícono en la barra de arriba del celular.
  "Más" es un botón que abre una lista "Más secciones" sobre la barra de abajo.
- [ ] `TituloDePagina({ children, subtitulo? })`: `h1` con la estética del hero y el subtítulo.

### Task 3: Subtítulos, pruebas en vivo y documentación

- [ ] Subtítulos en las pantallas principales (Inicio, Menú, Ventas, Proveedores, Gastos,
  Control de cierres, Cargar cierre, Mis cierres, Reportes, Usuarios, Auditoría, Mi cuenta).
- [ ] e2e: ayuda `abrirSeccion(page, nombre)` en `e2e/ayudas.ts` (si el enlace no se ve, toca
  "Más"); ajustar `acceso`, `usuarios`, `auditoria`, `reportes`; prueba nueva
  `e2e/sidebar.spec.ts` (activo marcado, "Más" en el celular, Caja sin "Más"); capturas.
- [ ] Documentación: `CLAUDE.md` (skill nueva), `PEDIDOS.md`.

---
name: estetica-panel
description: Usar al tocar el marco del panel de Manteca (la sidebar, las barras del celular) o el encabezado de una pantalla (el hero, TituloDePagina). Es la estética de Plan Reminder Pro con los colores y la tipografía de Manteca.
---

# Estética del panel (sidebar y hero)

Santiago la eligió el 2026-10-12 (pedido 35): la sidebar y el hero de **Plan Reminder Pro**
(`Trabajos Freelance/Sistema CobrarWpp/plan-reminder-pro`, `src/components/AppSidebar.tsx` y el
encabezado de `src/pages/Index.tsx`), **igual en todo salvo los colores y la tipografía**, que
son los de Manteca.

## Lo que no se cambia

- **Colores:** solo los tokens de `src/app/globals.css` (`primary`, `accent`, `card`, `border`,
  `muted-foreground`, `secondary`). Donde Plan Reminder Pro usa su verde, va `primary`; donde
  usa el esmeralda de la segunda mancha, va `accent`. Nada de colores sueltos (`slate-*`,
  `emerald-*`, `#hex`).
- **Tipografía:** la marca en Manic (`font-title`); títulos y texto en Neufile Grotesk. Plan
  Reminder Pro usa `font-extrabold` en los títulos: acá va `font-bold`, porque Neufile Grotesk
  llega hasta 700.

## Sidebar (computadora, desde `lg`)

- `aside` fijo a la izquierda: `fixed left-0 top-0 h-full w-[260px] border-r bg-card flex-col`.
- **Marca** (`p-8 pb-6`, `flex items-center gap-3`):
  - cuadrado `w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30` con el ícono `Croissant` (`text-primary-foreground`, tamaño 24);
  - "Manteca" en `font-title text-2xl leading-none`;
  - debajo, "Sistema de gestión" en `text-[8px] font-bold text-muted-foreground uppercase tracking-wider mt-1`.
- **Navegación** (`flex-1 p-4 space-y-1 mt-4`, `aria-label="Panel"`). Cada enlace es
  `flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300`, con ícono de lucide de 20:
  - activo: `text-primary bg-primary/10 shadow-sm ring-1 ring-primary/20`, con el ícono en `strokeWidth={2.5}`;
  - inactivo: `text-muted-foreground hover:text-foreground hover:bg-secondary/50`, con el ícono en `strokeWidth={2}`.
  - Plan Reminder Pro desliza el fondo del activo con framer-motion. Acá no se usa esa
    librería: queda el mismo aspecto, sin el deslizamiento.
- **Pie** (`p-4`): quién tiene la sesión y "Salir", con la misma forma de enlace inactivo e ícono `LogOut`.

## Celular (por debajo de `lg`)

- **Barra de arriba:** `fixed top-0 inset-x-0 h-14 z-50 bg-card/95 backdrop-blur border-b flex items-center justify-between px-4`, con la marca chica (cuadrado `w-8 h-8 rounded-lg`, ícono 18, "Manteca" en `text-lg`) y "Salir" como ícono (`h-9 w-9 rounded-xl text-muted-foreground`).
- **Barra de abajo:** `fixed bottom-0 inset-x-0 z-50 bg-card/95 backdrop-blur border-t flex`. Cada botón es `flex-1 h-16 flex flex-col items-center justify-center gap-1 text-[9px] font-bold`, ícono de 20; activo `text-primary`, inactivo `text-muted-foreground`.
- Plan Reminder Pro tiene 5 secciones. Con más de 5 enlaces, abajo van Inicio, Ventas, Gastos y
  Caja, más "Más" (ícono `Ellipsis`), que abre la lista "Más secciones" con el resto, en la
  misma forma que los enlaces de la sidebar. Con 5 o menos (Caja), van todos abajo.

## Contenido y hero

- `main`: `lg:ml-[260px] px-4 md:px-8 pt-20 pb-28 lg:p-10 min-h-dvh relative overflow-clip`, contenido en `max-w-7xl mx-auto`.
- **Manchas del fondo** (dentro de `main`, `-z-10`):
  - `absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px]`;
  - `absolute bottom-0 left-0 w-[300px] h-[300px] bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-[80px]`.
- **Hero** (`TituloDePagina`), con separación `mb-6 md:mb-10`:
  - título: `h1` en `text-2xl md:text-4xl font-bold tracking-tight`;
  - subtítulo: `text-sm md:text-base text-muted-foreground font-medium mt-1 md:mt-2`.

  Las pantallas principales de cada sección llevan subtítulo: una línea que dice para qué es.

## Al usarla

- La lógica (qué enlace está activo, qué va abajo en el celular) vive en
  `src/lib/acceso/navegacion.ts`, con sus tests.
- Las pruebas en vivo entran a una sección con `abrirSeccion` de `e2e/ayudas.ts`, que abre
  "Más" en el celular si hace falta.
- Mirar las capturas en los dos tamaños: nada tapado por las barras fijas.

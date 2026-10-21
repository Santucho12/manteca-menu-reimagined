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

- **Colores:** la marca son dos, el **crema** del fondo (`background`, `card`) y el **dorado** del
  nombre (`accent`, que es también `primary`). Donde Plan Reminder Pro usa su verde o su
  esmeralda, va el dorado. La letra queda oscura (`foreground`, `muted-foreground`): el dorado
  sobre crema da 2,5 a 1 y no se lee como texto, así que se usa en fondos tenues, bordes,
  íconos y el nombre de la marca. Nada de colores sueltos (`slate-*`, `emerald-*`, `#hex`). Tampoco `text-primary`, `text-accent`
  ni un borde de selección en dorado para marcar algo: sobre crema no llegan al contraste
  pedido. Para marcar lo elegido, borde oscuro (`border-foreground`) y fondo dorado tenue.
- **Tipografía:** la marca en Manic (`font-title`); títulos y texto en Neufile Grotesk. Plan
  Reminder Pro usa `font-extrabold` en los títulos: acá va `font-bold`, porque Neufile Grotesk
  llega hasta 700.

## Sidebar (computadora, desde `lg`)

- `aside` fijo a la izquierda: `fixed left-0 top-0 h-full w-[260px] border-r bg-card flex-col`.
- **Marca** (`px-8 pt-8 pb-4`): el logo de Manteca en dorado (`public/menu/logo-oscuro.png`, el de la carta), 150 px de ancho, con `alt="Manteca"`. Sin cuadrado ni "Sistema de gestión" (Santiago, 2026-10-21, pedido 40).
- **Navegación** (`aria-label="Panel"`, `px-4 py-2`): las secciones en tres grupos por momento del día, que arma `gruposDelPanel` de `src/lib/acceso/marco.ts`: "Día a día" (Inicio, Ventas, Caja), "Plata" (Gastos, Proveedores, Reportes) y "Ajustes" (Menú, Usuarios, Auditoría). El título de cada grupo, `text-[10px] font-bold tracking-[0.16em] uppercase text-muted-foreground`. Con pocas secciones (Caja) van juntas, sin título. Mi cuenta va aparte, al pie de la navegación, tras una línea.
- Cada enlace es `relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm`, con ícono de lucide de 20:
  - activo: una pestaña dorada pegada al borde izquierdo (`before:` de `w-1.5 h-6 rounded-r-full bg-accent`) y el texto `text-foreground font-bold`, sin fondo; ícono en `strokeWidth={2.5}`;
  - inactivo: `text-muted-foreground font-semibold hover:bg-secondary hover:text-foreground`.
- **Pendientes:** Caja (cierres con diferencia), Gastos (sin clasificar) y Usuarios (esperando rol) llevan su número en una píldora dorada (`bg-accent text-accent-foreground rounded-full text-xs font-bold`), con los mismos casos que los avisos de Inicio. En la barra de abajo del celular el número va sobre el ícono, así que el nombre del enlace queda "3 Gastos": las pruebas lo buscan con `^(\d+ ?)?Gastos`.
- **Pie** (`px-4 pb-4`): quién tiene la sesión y "Salir", con la forma de enlace inactivo e ícono `LogOut`.

## Celular (por debajo de `lg`)

- **Barra de arriba:** `fixed top-0 inset-x-0 h-14 z-50 bg-card/95 backdrop-blur border-b flex items-center justify-between px-4`, con el logo chico (104 px) y "Salir" como ícono (`h-9 w-9 rounded-xl text-muted-foreground`).
- **Barra de abajo:** `fixed bottom-0 inset-x-0 z-50 bg-card/95 backdrop-blur border-t flex`. Cada botón es `flex-1 h-16 flex flex-col items-center justify-center gap-1 text-[9px] font-bold`, ícono de 20; activo con la letra `text-foreground` y el ícono dorado, inactivo `text-muted-foreground`.
- Plan Reminder Pro tiene 5 secciones. Con más de 5 enlaces, abajo van Inicio, Ventas, Gastos y
  Caja, más "Más" (ícono `Ellipsis`), que abre la lista "Más secciones" con el resto, en la
  misma forma que los enlaces de la sidebar. Con 5 o menos (Caja), van todos abajo.

## Contenido y hero

- `main`: `lg:ml-[260px] px-4 md:px-8 pt-20 pb-28 lg:p-10 min-h-dvh relative overflow-clip`, contenido en `max-w-7xl mx-auto`.
- **Manchas del fondo** (dentro de `main`, `-z-10`):
  - `absolute top-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px]`;
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

# Movimiento del panel

PRP se mueve con tres cosas: `framer-motion` (entradas, salidas, la pestaña activa que se
desliza), animaciones de CSS (`tw-animate-css` y las propias de `panel.css`) y `lenis` (el scroll
suave). Las tres librerías van con la versión exacta de PRP, para que los resortes y los tiempos
sean los mismos:

| Librería | Versión | Para qué |
|---|---|---|
| `framer-motion` | `12.36.0` | `motion`, `AnimatePresence`, `layoutId` |
| `sonner` | `1.7.4` | los avisos que se van solos |
| `lenis` | `1.1.20` | el scroll suave |

Todo componente que use `motion` o `AnimatePresence` es de cliente (`'use client'`). Se importa
igual que en PRP: `import { motion, AnimatePresence } from 'framer-motion'`.

PRP no mira "reducir movimiento" del sistema: anima siempre, y Lenis lo dice a propósito. Se
replica así.

## framer-motion, pieza por pieza

Donde no se indica `transition`, va la que trae framer-motion (resorte en `x`, `y` y `scale`;
curva en `opacity`). No se agrega una propia.

| Pieza | `initial` | `animate` | `exit` | `transition` |
|---|---|---|---|---|
| Pestaña verde de la barra lateral | `false` | — | — | `{ type: 'spring', stiffness: 300, damping: 30 }`, con `layoutId="activeNav"` |
| Bloque del título (h1 y subtítulo) | `{ opacity: 0, x: -10 }` | `{ opacity: 1, x: 0 }` | `{ opacity: 0, x: 10 }` | `{ duration: 0.2 }` |
| Contenido de la pantalla | `{ opacity: 0, y: 20 }` | `{ opacity: 1, y: 0 }` | `{ opacity: 0, y: -20 }` | `{ duration: 0.3, ease: 'easeOut' }` |
| Grilla de tarjetas de números | variante `hidden: { opacity: 0 }` | `show: { opacity: 1, transition: { staggerChildren: 0.1 } }` | — | `initial="hidden" animate="show"` |
| Cada tarjeta de números | variante `hidden: { y: 20, opacity: 0 }` | `show: { y: 0, opacity: 1 }` | — | la de fábrica |
| Bloque oscuro | `{ y: 20, opacity: 0 }` | `{ y: 0, opacity: 1 }` | — | `{ duration: 0.5 }` |
| Barra de avance del bloque oscuro | `{ width: 0 }` | `{ width: '50%' }` | — | `{ duration: 1.5, ease: 'easeOut' }` |
| Fila de tabla (`motion.tr`) | `{ opacity: 0 }` | `{ opacity: 1 }` | `{ opacity: 0, scale: 0.95 }` | `{ duration: 0.2 }`; el `tbody` envuelve con `<AnimatePresence mode="popLayout">` |
| Sin resultados | `{ opacity: 0, scale: 0.95 }` | `{ opacity: 1, scale: 1 }` | — | la de fábrica |
| Ventana con formulario | `{ opacity: 0, scale: 0.9, y: 20 }` | `{ opacity: 1, scale: 1, y: 0 }` | igual que `initial` | la de fábrica |
| Ventana de un paso de plata | `{ opacity: 0, scale: 0.95, y: 20 }` | `{ opacity: 1, scale: 1, y: 0 }` | igual que `initial` | la de fábrica |
| Ayuda, recorrido, "Más" | `{ opacity: 0, y: 30 }` | `{ opacity: 1, y: 0 }` | `{ opacity: 0, y: 30 }` | la de fábrica |
| Hoja lateral | `{ opacity: 0, x: 300 }` | `{ opacity: 1, x: 0 }` | `{ opacity: 0, x: 300 }` | la de fábrica |
| Pasos de un asistente | `{ opacity: 0, y: 20 }` | `{ opacity: 1, y: 0 }` | `{ opacity: 0, y: -20 }` | la de fábrica; `<AnimatePresence mode="wait">` |
| Tilde de "terminado" | `{ scale: 0 }` | `{ scale: 1 }` | — | `{ type: 'spring', stiffness: 200, delay: 0.1 }` |
| Tarjeta de ingreso | `{ opacity: 0, y: 20 }` | `{ opacity: 1, y: 0 }` | — | `{ duration: 0.6, ease: 'easeOut' }` |

- Cada ventana y la hoja lateral se montan dentro de `<AnimatePresence>` en el componente que las
  abre, para que se vea la salida. Las ventanas simples y la confirmación de PRP no tienen
  `motion`: solo el fondo con `animate-in-fade`.
- Todas las capas oscuras de atrás entran con `animate-in-fade` (0,4 s).

## Cambio de pantalla en Next

PRP cambia de vista sin cambiar de ruta, con `<AnimatePresence mode="wait">`: la vista que se va
sale (0,2 a 0,3 s) y recién después entra la nueva. En Next cada pantalla es una ruta: el marco
(barra lateral, barras del celular, `main`) vive en el layout y no se vuelve a montar; la página
sí. Por eso:

- La pestaña verde se desliza de una sección a otra sin hacer nada más: la barra lateral está en
  el layout y `layoutId` la sigue.
- La entrada se replica: el bloque del título y el contenido son dos componentes de cliente, cada
  uno con su `motion.div` (tabla de arriba), y se animan al montarse la página. No van juntos en
  un `template.tsx`: el título se correría también hacia abajo.
- La salida no se replica: App Router saca la página vieja al instante. Es la única diferencia de
  movimiento con PRP.
- PRP pone `animate-in-fade` en el `header`; ahí solo corre una vez, al abrir la app. En Next el
  encabezado se monta en cada pantalla, así que va sin esa clase (si no, el botón de ayuda
  parpadearía en cada cambio).

## Animaciones de CSS

| Clase | Qué hace | Dónde la usa PRP |
|---|---|---|
| `animate-in-fade` | aparece en 0,4 s, `ease-out` | capas oscuras de las ventanas, marca del ingreso |
| `animate-in-slide` | sube 10 px y aparece en 0,5 s, `cubic-bezier(0.16, 1, 0.3, 1)` | la tabla, el contenido de cada pestaña, Configuración |
| `animate-in fade-in slide-in-from-bottom-4 duration-700` | sube 16 px y aparece en 0,7 s | la raíz de Mensajes, Plataformas y Configuración |
| `animate-in zoom-in duration-700` | crece desde 0 en 0,7 s | el vacío grande |
| `animate-in fade-in zoom-in-95 duration-200` | globo de una nota | `TooltipContent` |
| `animate-pulse-subtle` | late entre opacidad 1 y 0,7 cada 2 s | lo que vence hoy |
| `animate-spin` | gira | ruedas de "guardando" |

Efectos al pasar el mouse o tocar: `active:scale-95` en los botones, `hover:scale-110` en los
globitos de nota y en el lápiz de un mensaje, `hover:shadow-xl hover:shadow-slate-200/50` en las
tarjetas de números, `scale-[1.01]` en la zona de archivo mientras se arrastra. Las transiciones
son `transition-all` (150 ms), `duration-200` en filas y botones chicos, `duration-300` en la
barra lateral y las tarjetas.

## Scroll suave (`src/lib/smoothScroll.ts` de PRP)

Un componente de cliente en el layout del panel arranca Lenis una sola vez, con estos valores
exactos, y vuelve arriba de todo al instante cada vez que cambia `usePathname()`:

```ts
import Lenis from 'lenis';

let lenis: Lenis | null = null;

/** Hay un contenedor con scroll propio (ventana, desplegable, tabla) entre el nodo y la página. */
function dentroDeOtroScroll(nodo: HTMLElement): boolean {
  for (let el: HTMLElement | null = nodo; el && el !== document.body; el = el.parentElement) {
    if (el.closest('[role="dialog"], [role="listbox"], [data-radix-popper-content-wrapper]')) return true;
    const { overflowY } = getComputedStyle(el);
    if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) return true;
  }
  return false;
}

export function arrancarScrollSuave() {
  if (lenis || typeof window === 'undefined') return;
  lenis = new Lenis({
    lerp: 0.065,
    wheelMultiplier: 0.9,
    smoothWheel: true,
    syncTouch: true,
    syncTouchLerp: 0.052,
    touchInertiaMultiplier: 28,
    touchMultiplier: 1,
    prevent: dentroDeOtroScroll,
    autoRaf: true,
  });
}

export function volverArriba() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
}
```

El CSS de Lenis entra por `panel.css` (`@import 'lenis/dist/lenis.css'`). En Manteca la función
de 20 líneas de `new Lenis` se parte en un objeto de opciones y la llamada.

## Pantalla del celular y zoom

El layout del panel exporta siempre

```ts
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};
```

`viewportFit: 'cover'` hace falta para que `env(safe-area-inset-*)` valga algo y las barras del
celular no queden debajo de la muesca ni de la barra de inicio del iPhone.

PRP, además, no deja hacer zoom en el celular. Eso impide agrandar la letra a quien lo necesita,
así que **va solo si Santiago lo confirma**; mientras tanto el panel deja hacer zoom
(`touch-action: manipulation`, que ya está en `panel.css`, solo saca el zoom por doble toque). Si
lo confirma, el `viewport` suma `maximumScale: 1` y `userScalable: false`, y un componente de
cliente agrega, una vez, `document.addEventListener('gesturestart', (e) => e.preventDefault())`
(Safari en iPhone ignora `user-scalable=no`).

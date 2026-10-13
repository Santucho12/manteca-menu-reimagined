# Sidebar y hero con la estética de Plan Reminder Pro: diseño

Pedido 35. Santiago pidió, el 2026-10-12, que el panel tenga la sidebar y el hero de Plan
Reminder Pro (`Trabajos Freelance/Sistema CobrarWpp/plan-reminder-pro`, `AppSidebar.tsx` y el
encabezado de `pages/Index.tsx`), con los colores y la tipografía de Manteca. Todo lo demás,
igual. La estética queda escrita en una skill y se aplica desde ahí.

Decisiones (las recomendadas, aprobadas por Santiago):

1. **Celular:** barra fija arriba con la marca y Salir; barra fija abajo con 4 íconos (Inicio,
   Ventas, Gastos, Caja) y "Más", que abre el resto. Con 5 enlaces o menos (Caja tiene 3),
   van todos abajo y no hay "Más".
2. **Marca:** cuadrado `bg-primary` redondeado con el ícono `Croissant` en blanco y sombra del
   color; "Manteca" en Manic; "Sistema de gestión" abajo, chiquito, en mayúsculas.
3. **Enlace activo:** el aspecto de Plan Reminder Pro (fondo `primary/10`, borde fino
   `primary/20`, ícono más grueso, texto en `primary`), sin la animación de deslizamiento: no
   se suma `framer-motion`.
4. **Hero:** en todas las pantallas del panel. Título grande y apretado con un subtítulo debajo
   en las pantallas principales de cada sección; dos manchas de color difuminadas en el fondo
   (`primary` arriba a la derecha, `accent` abajo a la izquierda).

## Cambio de colores (Santiago, 2026-10-12, después del primer diseño)

La marca son dos colores: el crema del fondo y el dorado del nombre. El color principal
(`--primary`) pasa a ser el dorado, con la letra oscura, en todo el sistema: botones, globitos y
la sidebar. El dorado no se usa como color de letra (sobre crema no se lee): va en fondos, bordes,
íconos y el nombre de la marca. Donde abajo dice `primary` marrón o "en blanco", vale esto.

## La estética, traducida a Manteca

| Plan Reminder Pro | Manteca |
|---|---|
| Verde `primary`, verde esmeralda de la segunda mancha | `--primary` (marrón) y `--accent` (dorado) de `globals.css` |
| Outfit `font-extrabold` en títulos | Neufile Grotesk `font-bold` (no hay 800) |
| Outfit en el nombre de la marca | Manic (`font-title`) |
| Inter en el texto | Neufile Grotesk, como hoy |
| Íconos de `lucide-react` | Los mismos, ya instalados |

Medidas copiadas tal cual:
- **Sidebar:** `w-[260px]` fija a la izquierda, `bg-card`, `border-r`. La marca va con `p-8 pb-6`, cuadrado `w-10 h-10 rounded-xl shadow-lg shadow-primary/30`, nombre `text-2xl`, subtítulo `text-[8px] font-bold uppercase tracking-wider`. La navegación, con `p-4 space-y-1 mt-4`. Los enlaces, con `px-4 py-3.5 rounded-2xl text-sm font-semibold gap-3` e ícono de 20.
- **Celular:** barra de arriba `h-14 bg-card/95 backdrop-blur border-b`. Barra de abajo `h-16`, con ícono de 20 y texto de `9px` en negrita.
- **Main:** `lg:ml-[260px] px-4 md:px-8 pt-20 pb-28 lg:p-10`, contenido `max-w-7xl mx-auto`. Las dos manchas, `w-[500px] h-[500px] primary/5 blur-[100px]` y `w-[300px] h-[300px] accent/5 blur-[80px]`.
- **Hero:** título `text-2xl md:text-4xl tracking-tight`; subtítulo `text-sm md:text-base text-muted-foreground font-medium mt-1 md:mt-2`; separación `mb-6 md:mb-10`.

## Código

- `.claude/skills/estetica-panel/SKILL.md`: la estética de arriba, con las clases y lo que no se
  cambia (colores y tipografía de Manteca). Se suma a la tabla de skills de `CLAUDE.md`.
- `src/lib/acceso/navegacion.ts` (puro): `enlaceActivo(enlaces, ruta)` (el que más coincide;
  `/admin` solo exacto) y `repartirParaCelular(enlaces)` (`{ abajo, mas }`).
- `src/components/panel/`: `BarraLateral.tsx` (cliente: lee la ruta), `BarrasDelCelular.tsx`,
  `MarcaDelPanel.tsx`, `iconos.ts` (clave → ícono), y `MarcoDelPanel.tsx` arma todo.
- `TituloDePagina` suma `subtitulo?` y toma la estética del hero.
- La navegación de la sidebar y la de abajo del celular se llaman "Panel"; en cada tamaño se ve
  una sola. "Más" abre una lista "Más secciones".

## Pruebas

- Puros: `enlaceActivo` y `repartirParaCelular`.
- En vivo: en la computadora, la sidebar con los 10 enlaces y el activo marcado; en el celular,
  los 4 íconos y "Más" con el resto; Caja ve sus 3 abajo. Se ajustan las pruebas que entraban
  por la barra (`acceso`, `usuarios`, `auditoria`, `reportes`) con una ayuda que abre "Más" si
  hace falta. Capturas de Inicio, Gastos y Caja en los dos tamaños.

## Restricciones globales

- TDD estricto en lo que es lógica; sin mocks.
- 20 líneas por función en `.ts`, 80 por componente, 300 por archivo. Lógica fuera de `.tsx`.
- Colores de `globals.css` y tipografías del proyecto; nada de colores sueltos.
- Español con voseo.
- Solo Santiago autoriza el merge y publicar.
- Hecho es `npm run verificar` y `npm run e2e` en verde.

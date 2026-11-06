---
name: estetica-panel
description: Usar al construir, cambiar o revisar cualquier pantalla, componente o estilo del panel de Manteca (/admin, con el ingreso), o al tocar su layout, su CSS, sus colores, letras, íconos, tablas, ventanas, avisos o animaciones.
---

# Estética del panel: Plan Reminder Pro, tal cual

## Qué es

El panel de Manteca (`/admin`, incluidos ingreso, registro y cambio de contraseña) replica **tal
cual** la estética de Plan Reminder Pro (PRP): mismos colores, letras, tamaños, radios, sombras,
piezas, movimiento y comportamiento en el celular. Lo decidió Santiago el 2026-10-21. Solo cambian
la marca, lo que piden las pruebas de Manteca (abajo) y lo que Manteca necesita y PRP no tiene
(en `piezas.md`, marcado **(extensión)**). La carta pública (`/`) mantiene su estética y no se toca.

PRP es la app "FiestaCobra", en
`C:\Users\AMDRYZEN7\Desktop\Trabajos Freelance\Sistema CobrarWpp\plan-reminder-pro` (Vite,
React 18, Tailwind 3). Esta skill ya trae todo pasado a Manteca: el código de PRP se consulta
solo para algo que acá no esté. No se entra a su base real: tiene datos de sus clientes.

**El dorado de Manteca en vez del verde de PRP (Santiago, pedido 45).** El verde de marca
(`primary`, `accent`, `ring`) pasa a ser el dorado `#bfa042`, con letra marrón oscuro
`#2b1d14` encima (el blanco sobre el dorado no se lee). Los fondos son crema (`#f4efe5`) y los
grises de `slate` van en tonos cálidos: todo está en `panel.css`. Donde esta skill o `piezas.md`
digan "verde" de la marca, se lee "dorado"; `emerald` sigue con su significado (confirma plata o
exporta). El azul marino `#1e3a8a` de antes quedó descartado.

Decisiones de Santiago (2026-10-21):

- **Los rojos y grises de PRP**, aunque no pasen el contraste AA (el rojo de error, 3,6; los grises
  chicos, 2,6). El dorado con su letra marrón sí lo pasa. Es una excepción anotada en `PEDIDOS.md` (pedido 43): `tests/contraste.test.ts`
  mira solo la carta y no se extiende al panel.
- **Las tres librerías de PRP, con su versión exacta**: `framer-motion` 12.36.0, `sonner` 1.7.4 y
  `lenis` 1.1.20.
- **Marca**: el logo de Manteca (pedido 45), en lugar del cuadrado con la medialuna de PRP.
- **Zoom**: PRP bloquea el zoom en el celular; Manteca no (Santiago, 2026-10-22).

## Archivos

| Archivo | Qué tiene |
|---|---|
| `panel.css` | El CSS entero del panel: se copia a `src/app/admin/panel.css` sin cambios |
| `piezas.md` | Cada pieza de PRP con sus clases exactas, y cómo se arma cada tipo de pantalla |
| `componentes-base.md` | `Input`, `Select`, `Tabs`, `Tooltip` y `Toaster`, para `src/components/ui/` |
| `movimiento.md` | Animaciones pieza por pieza, cambio de pantalla en Next, scroll suave, zoom |
| `referencias/` | Capturas de PRP: `compu-*` a 1440×900, `tablet-*` a 1180×820, `celu-*` a 390×844 |

## Cómo se monta en Manteca

1. **Layout raíz propio.** El `layout.tsx` y el `page.tsx` de la carta pasan a
   `src/app/(carta)/`, con la misma URL (`globals.css` y `icon.svg` se quedan en `src/app/`), y
   `src/app/admin/layout.tsx` es otro layout raíz con su `<html lang="es-AR">` y su `<body>`. Así
   el CSS del panel (su paleta, su `hover:`, sus bases) no toca la carta, y lo que se dibuja fuera
   de `<main>` (listas de Radix, avisos) toma igual los colores y las letras. Entre `/` y `/admin`
   Next recarga la página. Sin layout en `src/app/`, una URL que no existe muestra el 404 de Next
   sin layout: al montarlo se comprueba que `/admin/guia-de-estilos` siga dando 404
   (`e2e/acceso.spec.ts`).
2. **`panel.css`** copiado entero e importado solo desde ese layout.
3. **Letras con `next/font/google`**, en `<html>` (si van en `<body>`, `--font-sans` no las ve):
   `Inter` y `Outfit`, cada una con `subsets: ['latin']`, `weight: ['400', '500', '600', '700']`,
   `display: 'swap'` y `variable: '--font-inter'` / `'--font-outfit'`. PRP carga solo esos
   cuatro pesos: por eso `font-extrabold` y `font-black` se ven en 700. Con la fuente variable
   entera se verían más gruesas (y un rango como `'400 700'` no lo acepta el tipo de `next/font`). IBM Plex Mono no va: PRP la declara, pero `font-mono` la pisa y el código sale en la
   mono del sistema.
4. **En el layout**: `TooltipProvider`, el arranque de Lenis y la vuelta arriba al cambiar de ruta
   (`movimiento.md`). El `<Toaster />` va dentro de `<main>`.
5. **Componentes base a mano** (`componentes-base.md`), nunca con `npx shadcn add`: el estilo de
   shadcn configurado en Manteca es otro y el CLI escribiría en el CSS de la carta.

## De Tailwind 3 a Tailwind 4

`panel.css` ya corrige lo general: la paleta de Tailwind 3 en hex (la de Tailwind 4 trae otros
tonos para los mismos nombres), los radios (`rounded-xl` = 12 px), el color del texto de ejemplo
de los campos, la manito sobre los botones, el `hover:` también al tocar, el resaltado al tocar en
el celular, la letra base de 14 px y Outfit en `h1`–`h4`. Lo que falta está en las clases, y
`piezas.md` ya lo trae cambiado:

| En PRP | En Manteca | Por qué |
|---|---|---|
| `shadow-sm` (también `data-[state=active]:shadow-sm`) | `shadow-xs` | En Tailwind 4, `shadow-sm` es otra sombra, más grande |
| `backdrop-blur-sm` | `backdrop-blur-xs` | `-sm` pasó a ser 8 px; el de PRP es 4 px. `backdrop-blur` solo sigue en 8 px |
| `outline-none` | `outline-hidden` | `outline-none` ahora saca el contorno también en alto contraste |
| `bg-gradient-to-r`, `bg-gradient-to-l` | `bg-linear-to-r/srgb`, `bg-linear-to-l/srgb` | Tailwind 4 mezcla los colores en oklab |
| `hsl(var(--primary))` en una clase arbitraria | `var(--color-primary)` o la clase del color (`accent-primary`) | Los colores ya son colores enteros, no tres números |
| `shadow-elevated` (hoja lateral, vista previa) | nada | No existe en PRP: esas piezas no tienen sombra |
| Un hijo de `space-y-*` con su propio `mt-*` o `mb-*` | el margen que resultaba en PRP | En Tailwind 3 ganaba el `space-y` y los márgenes se juntaban (quedaba el mayor); en Tailwind 4 gana el del hijo. Así, el `mt-10` del botón de ingreso no hacía nada (quedaba en 16 px) y los filtros de una lista quedan a 24 px, no 16 |

## Lo que piden las pruebas de Manteca

Las pruebas de Playwright de cada pantalla mandan sobre **qué** es cada cosa (lista, tabla,
enlace, botón, nombres y textos); PRP manda sobre **cómo se ve**. Antes de armar una pantalla se
leen sus pruebas en `e2e/` y se adapta la pieza sin cambiar su aspecto:

| La prueba busca | Se arma |
|---|---|
| Una lista y sus filas (`list`, `listitem`) | La tabla de PRP con roles de lista (`piezas.md`, Tabla) y las tarjetas del celular en `ul`/`li` |
| "Etiqueta: valor" dentro de una fila | La etiqueta en `sr-only` dentro de la celda |
| Un título (`heading`, `level: 1`) | `h1` con ese texto exacto ("Ingresar", "Inicio", "Gastos") y las clases del título de PRP |
| Un botón "Buscar" | El botón de la barra de filtros (extensión): la lista se busca en el servidor |
| Un filtro que es un enlace ("Ver desactivados") | Enlace con la forma de los desplegables (extensión) |
| `button` "Salir" y el nombre de quien entró | "Salir" en vez del "Cerrar sesión" de PRP, y el nombre en el pie de la barra (extensión) |
| `aviso(page)`: un `alert` dentro de `main` | El error escrito en el formulario, con `role="alert"`, y las ventanas dentro de `main` |
| La descripción de un campo (`toHaveAccessibleDescription`) | El error del campo con `aria-describedby` |
| Una confirmación (`alertdialog`) | La ventana de confirmación de PRP |
| `navigation` "Panel", `aria-current`, "Más" en el celular | El marco de `piezas.md`, con `src/lib/acceso/` |

Y lo que cambia por ser Next y no una sola página:

| En PRP | En Manteca |
|---|---|
| Elige compu o celular con JavaScript (`useIsMobile`, 1024 y 1280 px) | Con CSS: `hidden lg:flex` / `lg:hidden` y `hidden xl:block` / `xl:hidden` |
| Secciones como botones | `Link` con `aria-current="page"` en la activa |
| Título de pantalla en `h2` (el `h1` es la marca) | Título en `h1`, mismas clases; la marca en `<p className="font-display ...">` |
| Ventanas con `createPortal` en `body` | `createPortal` dentro de `<main>` |
| Vista que sale y vista que entra | Solo entra (`movimiento.md`) |
| Etiquetas sueltas | `<label htmlFor>` con su `id`: se ve igual |
| Montos sin centavos (`$9.800`) | El formato de Manteca (`src/lib/plata.ts`), con la tipografía de PRP |

## Reglas que no se ven a simple vista

- **Letra base de 14 px** con interlineado 1,6 y `-0.01em`. `html` sigue en 16: `text-sm` sigue
  siendo 14 px y `text-base` 16.
- **Todo `h1`–`h4` sale en Outfit**, aunque la clase no lo diga; el resto, en Inter. Los números
  grandes de PRP son `h2` o `h3`. Si se cambia la etiqueta, se agrega `font-display`.
- **Etiquetas en mayúsculas por clase** (`uppercase`): en el código el texto va normal ("Nombre
  completo") y la pantalla lo muestra en mayúsculas.
- **Las manchas de color del fondo no se ven**: PRP las dibuja con `-z-10` y quedan detrás del
  fondo. No se agregan.
- **Colores**: los del tema (`primary`, `secondary`, `muted`, `border`…) y solo estas familias de
  la paleta: `slate`, `emerald`, `rose`, `amber`, `violet`, `blue` y `sky`. Más `#25D366` para
  WhatsApp y `#0F172A` para el bloque oscuro. Ninguno más.
- **Qué color dice qué**: dorado (`primary`) la marca, lo activo y la acción principal;
  `emerald-600` lo que confirma plata o exporta; `rose` lo urgente y lo que se borra o anula;
  `amber` lo que viene y las advertencias; `slate` lo vencido, neutro o apagado; `violet` lo
  secundario (grupos, seguimiento); `blue` solo en el hover de editar.
- **Íconos de lucide-react**, con tamaño fijo por lugar: 20 en la navegación (trazo 2,5 si está
  activa), 18 en los botones de encabezado y en las tarjetas de números, 24 en los cuadrados de
  las tarjetas de sección, 16 en las acciones de una fila, 13–14 en los botones chicos, 12 en las
  etiquetas, las insignias y los títulos de columna, 20 en la X de las ventanas, 22 en el ⓘ.
- **Sin modo oscuro** (las clases `dark:` de PRP no se copian) y **sin esqueletos de carga**.
- **Textos**: español rioplatense con voseo, como PRP ("Buscá, filtrá y organizá").
- **Nada se corta en el celular** (Santiago, 2026-11-01, pedido 79). El texto de contenido
  (nombres, descripciones, detalles, emails) baja de renglón con `wrap-break-word` (un email,
  con `wrap-anywhere`) en lugar del `truncate` de las recetas de PRP. Siguen con `truncate` solo
  los rótulos de controles y barras: un desplegable, el nombre de un archivo, quien entró. Las
  tablas de los reportes entran justas en 360 px y, si un monto no entra, se deslizan dentro de su
  tarjeta. Los ejes de los gráficos llevan montos cortos (`pesosCortos`: $12 M) y lugar a la
  derecha para el último número; el monto exacto va en la ventanita. Lo prueba
  `e2e/recortes.spec.ts`.

Las reglas de `CLAUDE.md` siguen valiendo: las recetas son JSX de muestra y en Manteca se parten
en componentes de hasta 80 líneas, con la lógica en `.ts` y nombres en español.

## Cómo comprobar que quedó igual

- Sacar capturas de la pantalla nueva con Playwright a **1440×900, 1180×820 y 390×844** y ponerlas
  al lado de las de `referencias/` del mismo tamaño. Se miran la letra de los títulos (Outfit),
  el verde, los radios, las sombras, los espacios y las mayúsculas de las etiquetas.
- En la consola del navegador: `getComputedStyle(document.querySelector('h1')).fontFamily`
  empieza con la Outfit de next/font; el `body` mide `14px`; un botón principal tiene fondo
  `rgb(191, 160, 66)` y letra `rgb(43, 29, 20)`.
- Una pieza que no está en las capturas se compara contra su archivo de PRP, citado en
  `piezas.md`.

## Errores comunes

| Error | Qué pasa | Cómo va |
|---|---|---|
| Copiar las clases de PRP sin pasarlas a Tailwind 4 | Sombras más grandes, desenfoques al doble (`backdrop-blur-sm` da 8 px), degradados de otro tono | Las de `piezas.md`, que ya están pasadas |
| Copiar los márgenes de PRP dentro de un `space-y-*` | Espacios que en PRP no existían (el botón de ingreso a 40 px del campo) | La regla de la tabla de Tailwind 3 a 4 |
| Agregar las manchas de color del fondo | Aparece un brillo verde que PRP no muestra | No van |
| Una `<table>` común donde la prueba busca una lista | La prueba no encuentra las filas | La tabla con roles de lista |
| Cambiar textos de PRP que las pruebas buscan, o dejar los de PRP ("Cerrar sesión", "Iniciar sesión") | Fallan las pruebas | Los textos de la tabla de las pruebas |
| Dejar afuera la ayuda ⓘ, los avisos de sonner o el scroll de Lenis por parecer opcionales | Ya no es PRP | Están decididos: van |
| Poner el logo de la carta en vez del cuadrado verde | Otra marca | La de la decisión de Santiago |
| Instalar componentes con `npx shadcn add` | Otro estilo, y colores escritos en el CSS de la carta | `componentes-base.md`, a mano |
| Poner el panel debajo del layout de la carta o pintar los colores en un `div` | Las listas y los avisos que van a `body` salen con los colores de la carta | Layout raíz propio con `panel.css` |
| Cargar Inter y Outfit enteras, o ponerles la clase en `<body>` | Títulos más gruesos, o la letra del sistema | `weight: ['400', '500', '600', '700']` y la clase de `next/font` en `<html>` |
| Usar los colores de Tailwind 4 o agregar familias nuevas | Rosas, ámbares y verdes más saturados que en PRP | Las siete familias de `panel.css` |
| Un `p` donde PRP tiene un `h3` | El número sale en Inter | La etiqueta de PRP, o `font-display` |
| Ajustar los rojos o grises "para que pase el contraste" | Ya no es PRP | Exacto: es decisión de Santiago |
| `bg-primary text-white` (receta de PRP) | Si cambia la letra del tema, ese botón no la sigue | `bg-primary text-primary-foreground` |
| Dibujar una ventana o la hoja "Más" dentro de un elemento con `backdrop-blur` o `transform` (la barra de abajo, el contenido animado) | El `fixed` queda atado a ese elemento y no tapa la pantalla | `createPortal` a `<main>` |
| Repetir `layoutId="activeNav"` fuera de la barra lateral (en "Más") | La pestaña verde salta entre los dos | Solo en la barra lateral |
| Envolver el `motion.tr` dentro de `AnimatePresence mode="popLayout"` | La salida de la fila no anda | El `motion.tr` va como hijo directo |
| Ponerle el nombre del registro a otro enlace de la fila (`aria-label="WhatsApp a …"`) | `getByRole('link', { name })` encuentra dos | Ese enlace se nombra solo por lo que hace |

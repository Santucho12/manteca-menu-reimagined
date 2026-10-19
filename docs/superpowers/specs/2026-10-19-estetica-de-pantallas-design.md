# Estética de Plan Reminder Pro en Inicio, Menú y Ventas: diseño

Pedido 38. El 2026-10-19 Santiago pidió que el **cuerpo** de Inicio, Menú y Ventas tenga la
estética de FiestaCobra (Plan Reminder Pro: `Trabajos Freelance/Sistema CobrarWpp/plan-reminder-pro`,
pantallas Dashboard, Clientes, Mensajes y Plataformas) con los colores y la tipografía de Manteca.
El marco (sidebar, barras del celular) y el hero ya la tienen (pedido 35, skill `estetica-panel`).

Vio una maqueta de las tres pantallas y le gustó tal como estaba
(`.superpowers/brainstorm/36708-1792448247/content/pantallas.html`, no se commitea). Este
documento la describe.

## Para qué

Que el panel se vea como un producto terminado y parejo, igual que FiestaCobra, sin perder la
marca de Manteca. No cambia qué hace ninguna pantalla: mismos datos, mismos enlaces, mismas
acciones, mismos textos.

## Fuera de alcance

- Las demás pantallas (Gastos, Caja, Reportes, Proveedores, Usuarios, Auditoría, Mi cuenta, los
  formularios de alta y edición, el detalle de una venta, Canales, Aumento, Desactivados) y el
  Inicio de Caja. Siguen como están; se les aplica después si Santiago lo pide.
- Nada de datos nuevos ni de consultas nuevas a la base. Lo que la maqueta muestra y hoy no
  existe (un cálculo que no esté) no se agrega; ver "Inicio".
- El menú público.

## Lo que no se cambia (de `estetica-panel`)

- Colores de `globals.css`: crema de fondo (`background`, `card`), dorado (`accent` = `primary`),
  letra oscura (`foreground`, `muted-foreground`). Nada de colores sueltos (`slate-*`, `#hex`).
  El dorado no va como color de letra sobre crema: va en fondos tenues (`bg-accent/10`,
  `/15`), bordes (`ring-accent/40`), íconos y barras. Sobre el bloque oscuro sí puede ir como
  letra o barra, porque ahí contrasta.
- Neufile Grotesk en todo, títulos en `font-bold` (no hay 800). Íconos de `lucide-react`.

## Piezas comunes (nuevas, en `src/components/panel/`)

Las tres pantallas comparten estas piezas; se escriben una vez.

- **Panel** (la tarjeta grande de FiestaCobra): `bg-card border rounded-3xl overflow-hidden`,
  con una cabecera opcional `px-6 py-5 border-b flex items-center justify-between` que lleva
  una etiqueta y, a la derecha, un contador en píldora.
- **Etiqueta**: `text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground`.
- **Píldora** (contador o estado): `rounded-full px-3 py-1 text-xs font-bold tracking-wider`,
  `bg-secondary`; la de estado con `bg-accent/10 ring-1 ring-accent/40`.
- **Ícono en cuadrado**: `size-10 rounded-xl bg-accent/15 grid place-items-center`, ícono de
  lucide de 20 en `text-foreground`.
- **Botón grande del hero** (las acciones principales arriba a la derecha):
  `rounded-2xl px-6 py-3.5 font-bold uppercase tracking-[0.12em] text-sm`; el principal en
  dorado con sombra `shadow-lg shadow-accent/30`, el otro en `bg-card` con borde. En el celular
  van debajo del título, a lo ancho.
- **Barra de filtros**: `Panel` sin cabecera con `p-4`, campos en `bg-secondary rounded-2xl` sin
  borde.

## Inicio (admin)

De arriba abajo:

1. Hero, como hoy.
2. **Cuatro tarjetas** (Ventas, Gastos, Resultado, Ticket promedio), con los mismos números y
   variaciones de hoy (`numerosDelMes`): etiqueta arriba a la izquierda, ícono en cuadrado a la
   derecha, número grande (`text-3xl font-bold`), y un pie separado por una línea con la
   variación en mayúsculas chicas y un punto dorado. Grilla: una por fila en el celular, de a dos
   en tableta, cuatro en computadora (la regla actual de `Totales`, por los montos de 8 cifras).
3. **Bloque oscuro "Ventas del mes"**: `bg-foreground text-background rounded-3xl p-8`. A la
   izquierda, la etiqueta, "Del 1 a hoy · N ventas" y el monto de ventas enorme
   (`text-5xl md:text-6xl font-bold tracking-tight`). A la derecha, un recuadro translúcido con
   Gastos y Resultado y una barra dorada con "lo que queda de cada peso vendido" (resultado sobre
   ventas). En el celular, el recuadro va debajo. Si el resultado está "Sin calcular" o las
   ventas son cero, no hay barra y dice "Sin calcular". La cantidad de ventas sale de
   `totalesDeVentas(actual.ventas).ventas`; el porcentaje, de un cálculo puro nuevo en
   `src/lib/inicio/`.
4. **Tres paneles** en fila en la computadora (uno por fila en el celular): "Para atender" (los
   avisos de hoy, cada uno con su enlace; si no hay avisos, el panel no aparece y los otros dos
   ocupan el ancho), "Mes a mes" (el gráfico de hoy, `GraficoPorMes`, sin cambiar sus datos) y
   "Más vendidos" (la lista de hoy).

Se mantienen los nombres accesibles de hoy (secciones "Para atender", "Este mes", "Mes a mes",
"Más vendidos", la lista "Más vendidos") para que las pruebas existentes sigan valiendo.

## Ventas

1. Hero con los botones grandes a la derecha: "Cargar venta" (principal) y "Canales".
2. El aviso de Fudo, como hoy, en texto chico debajo.
3. **Barra de filtros** con los cinco filtros de hoy y "Filtrar"; mismos nombres de campo.
4. **Panel "Ventas"**: en la cabecera, la etiqueta con lo cobrado (la primera línea de
   `lineasDelResumen`) y en píldora la cantidad de ventas que hay en la lista (`lista.total`); la segunda línea (lo cancelado), debajo en chico.
5. Dentro, en la computadora una **tabla** con encabezados en mayúsculas: Fecha (enlace al
   detalle, como hoy), Origen y canal, Medios, Total, Estado (píldora con el texto de
   `estadoDeVenta`, en todas las filas; lo que no cuenta, con el total tachado y en gris como hoy). En el celular, la lista
   de tarjetas de hoy con el mismo estilo, sin tabla.
6. La paginación, como hoy, debajo del panel.

## Menú

1. Hero con los botones grandes a la derecha: "Nuevo producto" (principal), "Nueva categoría" y
   "Aumento de precios".
2. El aviso de Fudo, como hoy.
3. Cada categoría es un **Panel**: en la cabecera, el ícono de la categoría en un cuadrado
   grande (`size-13 rounded-2xl`), el nombre (`text-xl font-bold`), y debajo el subtítulo y
   "N productos"; a la derecha, las acciones de la categoría como íconos.
4. Cada producto es una fila: nombre en negrita con su etiqueta en píldora, presentaciones debajo
   en gris, y a la derecha el precio grande (`text-lg font-bold`) y las acciones como íconos.
   Con varias presentaciones, los precios van como hoy en el texto de debajo y a la derecha no
   va precio grande. En el celular las acciones van en una fila debajo.
5. **Acciones como íconos** (lucide): subir `ArrowUp`, bajar `ArrowDown`, ocultar `EyeOff` /
   mostrar `Eye`, editar `Pencil`, desactivar `Ban`. Botones `size-11` (44 px, el mínimo del
   proyecto) sin borde, `text-muted-foreground hover:bg-secondary rounded-xl`. Mantienen los
   `aria-label` de hoy ("Subir X", "Ocultar X", "Editar X"…) y suman un `title` con lo mismo. La
   confirmación de desactivar queda como hoy.
6. "Ver desactivados" al final, como hoy.

## Reglas del proyecto que aplican

- TDD: cada cambio de pantalla arranca por su prueba de Playwright (o por el test puro del cálculo
  nuevo), se la ve fallar y después se escribe el código. Sin mocks.
- Largo: componentes de hasta 80 líneas, funciones de `.ts` de hasta 20, archivos de hasta 300.
  La lógica (el porcentaje, qué precio va grande) va a un `.ts` con su test puro.
- Español rioplatense en los textos; plata en centavos enteros, mostrada con `formatearPesos`.
- Cerrar con `npm run verificar` y `npm run e2e` enteros, en los dos tamaños, con capturas
  revisadas. Por la memoria de la máquina, por partes y en primer plano.
- Publicar es de Santiago: con las variables ya cargadas en Vercel, un merge a `main` publica.
- La skill `estetica-panel` suma estas piezas comunes, para que las próximas pantallas las usen.

## Lo que queda al que construye

Los nombres de los componentes, el reparto en archivos y el ícono de cada tarjeta de Inicio
(sugerido: `ShoppingBag`, `Receipt`, `TrendingUp`, `Ticket`).

# Gastos desde cero: diseño

Pedido 58. Parte de `docs/modulos/04-gastos.md`, de la revisión lógica del 2026-10-27 y de lo
que decidió Santiago ese día en el chat. Reemplaza las pantallas de
`2026-10-08-gastos-design.md` y de Gastos en `2026-10-22-panel-desde-cero-design.md`; la base y
las reglas de esos documentos siguen valiendo salvo lo que cambia acá.

## Para qué

Santiago no entendía Gastos: no se veía cuáles gastos se repiten, lo que viene no aparecía al
lado de lo pagado, "Recurrentes" era una pantalla aparte que no se entendía y el proveedor
aparecía siempre, aunque la categoría no lo pidiera. La sección se rehace para que todo esté en
una pantalla y se entienda sin leer la ayuda.

**Éxito:** al abrir Gastos, Santiago ve cuánto pagó en el mes, qué gastos son fijos y cuáles
son los próximos pagos, carga un gasto fijo desde el mismo botón que uno suelto y clasifica los
gastos de la caja sin cambiar de pantalla.

**Fracaso aunque ande:** que un gasto fijo se cuente dos veces, que lo que viene se mezcle con
lo pagado, o que vuelva a aparecer un campo o una columna que no aplica.

## Decisiones (Santiago, 2026-10-27)

1. Los "recurrentes" pasan a llamarse **gastos fijos**. En cada fila: "Fijo".
2. Una sola pantalla con todo a la vista: **Pagados** (por mes) y **Próximos pagos**. En la
   computadora, lado a lado; en el celular, uno abajo del otro. **Categorías** pasa a una
   ventana dentro de Gastos. Se van las pantallas de Recurrentes y de Categorías.
3. Un solo **Cargar gasto**, con la opción **"¿Se repite?"**: No, Todos los meses, Cada dos
   meses, Una vez por año.
4. Pagados se elige **por mes, con flechas** (‹ octubre 2026 ›), no con desde y hasta.
5. Los gastos de caja sin clasificar van en un recuadro **"Para clasificar"** arriba de todo, y
   se clasifican ahí mismo.
6. **Calendario propio** con los colores del panel (`react-day-picker`), con atajos "Hoy" y
   "Ayer".
7. **Proveedor solo en las categorías que lo piden**, y ahí es obligatorio. El campo no aparece
   en las demás y la columna Proveedor sale de la lista.
8. Sin filtro de proveedor, y los filtros se aplican solos, sin botón "Filtrar" (pedido en la
   misma sesión).
9. **Arreglo:** cambiar la fecha o la frecuencia de un fijo vale desde el próximo pago y no
   vuelve a cargar pagos que ya pasaron. Hoy los duplica.
10. Los fijos se ordenan por su próximo pago, no por la primera fecha que se cargó.
11. Se hace en la rama `feat/mes-a-mes-aireado`, por excepción anotada en `PEDIDOS.md`.

Se mantiene lo decidido el 2026-10-06 y después: el fijo se carga solo el día que vence, ya
contado; nada se borra, se anula con motivo; la misma carga mandada dos veces no duplica; el
efectivo de la caja no se carga a mano; a un gasto de caja no se le cambian monto, fecha ni medio
de pago; un fijo reactivado no carga lo que venció mientras estaba pausado; el día que no existe
en un mes pasa al último.

## Pantalla: Gastos (`/admin/gastos`)

Encabezado: h1 "Gastos", subtítulo "Lo que pagaste y lo que viene.", botones "Categorías"
(neutro, abre la ventana) y "Cargar gasto" (principal, va a `/admin/gastos/nuevo`), y la ayuda ⓘ.

Al abrir se generan los fijos vencidos hasta hoy (`generarAlAbrir`, como ahora).

### 1. Para clasificar

Solo si hay gastos de caja sin clasificar y sin anular, de cualquier mes. Panel con acento ámbar:
título "Para clasificar" con la cantidad y la línea "Se pagaron con la caja. Elegí la categoría
de cada uno."

Lista `Para clasificar`, del más viejo al más nuevo. Cada fila: la fecha entera (`15/06/2000`),
lo que escribió Caja (o "Sin descripción"), el monto, la lista "Categoría" (las activas que se
pueden elegir), la lista "Proveedor" si la categoría elegida lo pide, y el botón "Listo". Al
guardar sale el aviso "Gasto clasificado" y la pantalla se actualiza: la fila sale del recuadro y
el gasto aparece en Pagados con su categoría. Un error se escribe en la fila (`role="alert"`).

### 2. Próximos pagos

Panel con la lista `Próximos pagos`: un renglón por cada fijo activo, ordenado por su próximo
pago (y por nombre si coinciden). Cada renglón: la fecha en una baldosa ámbar ("5 nov"), el
nombre (descripción, o la categoría si no tiene) como enlace a `/admin/gastos/fijos/[id]`, el
detalle ("Todos los meses · En 9 días") y el monto.

- **Próximo pago** de un fijo: el primer vencimiento posterior a hoy que no sea anterior a
  `generar_desde`. El de hoy ya está cargado en Pagados.
- El detalle dice "Mañana" o "En N días" hasta 30 días; más lejos, solo la frecuencia.
- Al pie: "Falta pagar este mes: $X", la suma de los fijos activos cuyo próximo pago cae entre
  mañana y el último día del mes de hoy. Si no queda ninguno: "Este mes no quedan pagos fijos."
- Los pausados van abajo, plegados en "Pausados (N)", con la insignia "Pausado" y el enlace.
- Sin fijos: "Todavía no hay gastos fijos. Cargá uno con Cargar gasto y elegí cada cuánto se
  repite."

### 3. Pagados

Panel con cabecera: título "Pagados", las flechas del mes ("Mes anterior", "octubre 2026",
"Mes siguiente"), la cantidad de gastos y "Total: $X" (sin anulados). La flecha siguiente no
existe en el mes de hoy: no se navega a meses que no llegaron.

Debajo, los filtros, que se aplican solos: pastillas "Todos", "Fijos" y "De caja" (enlaces, la
elegida con `aria-current`) y la lista "Categoría" ("Todas las categorías"), que se manda sola al
cambiar.

"Fijos" son los gastos que cargó un fijo (`recurrente_id`) y "De caja", los que vinieron de un
cierre (`cierre_id`). El total y la cantidad respetan todos los filtros.

Lista `Gastos`, del más nuevo al más viejo, de a 25 con páginas. Cada fila:

- la fecha en una baldosa ("22 oct", con el mes en tres letras: ene, feb, mar, abr, may, jun,
  jul, ago, sep, oct, nov, dic);
- el nombre: la descripción, o la categoría si no tiene, como enlace a `/admin/gastos/[id]`;
- el detalle: la categoría (si el nombre es la descripción), el proveedor (si tiene) y el medio
  de pago, separados por " · ";
- las marcas: "Fijo · Todos los meses" (con la frecuencia de su fijo), "De caja", "Anulado";
- el monto, tachado si está anulado.

Vacío: "No hay gastos en octubre." y, con filtros, "No hay gastos que coincidan con los filtros."

URL: `?mes=AAAA-MM` (por defecto el de hoy; uno inválido o futuro vuelve al de hoy),
`&tipo=fijos|caja`, `&categoria=<uuid>` y `&pagina=N`. Los enlaces conservan los demás filtros y
vuelven a la página 1 al cambiar uno.

### Distribución

Desde `xl`: dos columnas (`xl:grid-cols-3`), Pagados en dos tercios a la izquierda y Próximos
pagos a la derecha. Por debajo: Para clasificar, Próximos pagos y Pagados, en ese orden (Próximos
es corta y si va abajo queda escondida detrás de la página de Pagados).

### 4. Ventana de categorías

El botón "Categorías" abre la ventana `Categorías de gastos`:

- Lista `Categorías`: las activas por nombre y después las desactivadas. Cada una con su nombre,
  la marca "Pide proveedor" si la pide, "Desactivada" si lo está, y las acciones "Editar" (el
  renglón pasa a ser un formulario con "Nombre", la casilla "Pide proveedor", "Guardar" y
  "Cancelar") y "Desactivar" o "Reactivar". "Sin clasificar" no tiene acciones y dice "Para los
  gastos de la caja".
- Abajo, "Sumar una categoría": "Nombre de la categoría nueva", la casilla "Pide proveedor" con la
  ayuda "Al cargar un gasto de esta categoría se elige el proveedor." y el botón "Sumar".
- Cada cambio actualiza la pantalla y deja un aviso que se va solo. Los errores ("Ya hay una
  categoría con ese nombre.") se escriben en la ventana.

## Pantalla: Cargar gasto (`/admin/gastos/nuevo`)

h1 "Cargar gasto", subtítulo "Anotá lo que pagaste. Si se repite, se carga solo." Campos, en
orden:

1. **Fecha**: el calendario, con "Hoy" y "Ayer" al lado. Arranca en hoy.
2. **¿Se repite?**: opciones que se eligen tocando (grupo de radios): No, Todos los meses, Cada
   dos meses, Una vez por año. Arranca en No. Con una repetición elegida aparece una línea que
   dice qué va a pasar (`resumenDeRepeticion`):
   - Con la fecha de hoy: "Se carga hoy y después todos los meses, el día 27."
   - "Se carga el 27/10 y después todos los meses, el día 27."
   - "Se carga el 27/10 y después cada dos meses, el día 27."
   - "Se carga el 27/10 y después todos los años, el 27/10."
   - Con una fecha pasada: "Se cargan los pagos del 05/07 a hoy, y después todos los meses, el
     día 5."
   - Del 29 al 31, se suma: "En los meses más cortos, el último día."
3. **Categoría**.
4. **Proveedor**, solo si la categoría lo pide.
5. **Monto**.
6. **Descripción**.
7. **Medio de pago** (sin "Efectivo de la caja", como ahora).
8. **Comprobante (opcional)**, solo si no se repite: un comprobante es de un pago.

"Guardar" vuelve a Gastos. Sin repetición se crea un gasto; con repetición, un fijo cuyo primer
pago es la fecha, y al volver a Gastos ya se ven cargados los pagos hasta hoy. Un gasto suelto no
puede tener fecha posterior a hoy ("Un gasto que todavía no pagaste no se carga. Si se repite,
elegí cada cuánto."): un fijo sí, y aparece en Próximos pagos. Por eso el calendario no deja
elegir días futuros mientras "¿Se repite?" está en No, y sí con una repetición. Cada formulario
lleva su clave, y también el fijo (ver Base).

## Pantalla: Gasto (`/admin/gastos/[id]`)

El mismo formulario sin "¿Se repite?", con "Cargado por" arriba, como ahora. Si lo cargó un fijo,
la franja: "Lo cargó solo el gasto fijo «Alquiler del local». Si cambió para los próximos meses,
editá el gasto fijo." con el enlace. Si es de caja, la franja de hoy, y fecha, monto y medio de
pago quedan de solo lectura (el calendario, deshabilitado). Anular con motivo, salvo los de caja.
Anulado: los datos y el motivo, como ahora.

## Pantalla: Gasto fijo (`/admin/gastos/fijos/[id]`)

h1 "Gasto fijo", subtítulo "Se carga solo cada vez que toca." Insignia "Pausado" si no está
activo.

- Formulario: Categoría, Proveedor (misma regla), Monto, Descripción, Medio de pago, "¿Cada
  cuánto?" (Todos los meses, Cada dos meses, Una vez por año) y "Próximo pago" (el calendario,
  desde mañana; arranca en el próximo pago calculado). Nota: "Lo que ya se cargó no cambia. Si
  cambiás la fecha o cada cuánto, vale desde el próximo pago."
- "Guardar" vuelve a Gastos.
- "Pausar" o "Reactivar", con la línea "Pausado, deja de cargarse. Al reactivarlo, se carga desde
  ese día."
- "Ya se cargaron": los últimos 6 gastos de este fijo, con fecha, monto, enlace y "Anulado" si lo
  está. Sin ninguno: "Todavía no se cargó ninguno."

## Reglas

1. **Proveedor.** El campo aparece si la categoría elegida pide proveedor, o si el gasto (o el
   fijo) ya tenía uno y no se le cambió la categoría: así uno viejo no lo pierde. Si no aparece,
   se guarda sin proveedor. Donde aparece por la categoría, es obligatorio (`PG202`, como ahora).
2. **Fecha y frecuencia de un fijo.** Si al editar cambian el próximo pago o la frecuencia, el
   fijo pasa a contar desde el próximo pago: `primer_vencimiento` y `generar_desde` toman esa
   fecha, que tiene que ser posterior a hoy (`PG208`, "El próximo pago tiene que ser después de
   hoy."). Si no cambiaron, la fecha guardada no se toca (un 31 sigue siendo 31).
3. **Clave del fijo.** La misma carga de un fijo mandada dos veces devuelve el mismo fijo.
4. **Gasto suelto con fecha futura:** se rechaza en el servidor (regla nueva, por la pantalla:
   Pagados no navega al futuro).
5. **Clasificar** cambia solo la categoría y el proveedor de un gasto. Sirve para cualquier
   gasto sin anular, pero se usa para los de caja.

## Base (una migración: `gastos_fijos`)

- `gastos_recurrentes.clave uuid unique`, que se puede cargar al crear (grant de insert).
- `reglas_de_recurrentes()`: en un update que cambia `primer_vencimiento` o `frecuencia`,
  `PG208` si la fecha no es posterior a hoy en Argentina, y `generar_desde := primer_vencimiento`.
  Al reactivar, `generar_desde := greatest(generar_desde, hoy)`: una fecha futura elegida antes
  no se pierde.
- `gastos_total(desde, hasta, la_categoria, el_proveedor, el_tipo)`: suma `el_tipo text`
  (`'fijos'` o `'caja'`, nulo para todos). Se borra la firma vieja y se recrea con sus grants.
- Reversa en `supabase/reversas/`, `schema.sql` y los tipos de `src/lib/supabase/tipos.ts`
  regenerados. Se aplica a la base de pruebas; a la real, cuando lo decida Santiago.

## Código

- `src/lib/gastos/` (puros, con sus tests): `meses.ts` (el mes de la URL, anterior y siguiente,
  su nombre y su rango), `filas.ts` (nombre, detalle, marcas y fecha corta de un gasto),
  `fijos.ts` (próximo pago, "en N días", falta pagar este mes, orden, resumen de la repetición,
  si cambió la serie), `proveedor.ts` (si se muestra el proveedor) y `pantalla.ts` (filtros y
  enlaces con mes y tipo).
- Consultas y escrituras con la sesión del admin: listar los gastos del mes con tipo y total,
  los sin clasificar (lista), los fijos, un fijo, los pagos de un fijo, cargar (gasto o fijo),
  editar un fijo, clasificar. `consultas.ts` y `escritura.ts` se parten para no pasar 300 líneas.
- `src/app/admin/(panel)/gastos/`: la pantalla, sus piezas (para clasificar, próximos, pagados,
  filtros, ventana de categorías), el formulario único, `fijos/[id]` y las acciones de servidor.
  Se borran `recurrentes/` y `categorias/`.
- `src/components/formularios/CampoDeFecha.tsx`: el calendario en un desplegable de Radix
  (`radix-ui`, ya instalado), con `react-day-picker` 10.0.2 fijada exacta, en español, la semana
  desde el lunes, las clases de Plan Reminder Pro y el `hoy` que manda el servidor (el navegador
  no decide qué día es). El disparador es un botón con su `label` ("Fecha", "Próximo pago").
- `src/components/panel/PanelDeLista.tsx`: el panel de lista con cabecera de `piezas.md`.
- Afuera de Gastos: Inicio (los avisos de sin clasificar y de vencimientos llevan a
  `/admin/gastos`), Auditoría ("Gasto fijo" y el enlace a `/admin/gastos/fijos/[id]`),
  Proveedores ("Tiene 1 gasto fijo activo", con enlace a Gastos), las ayudas (`gastos` y `fijos`,
  que reemplazan a `recurrentes` y `categorias`), `e2e/pantallas.ts` y `docs/modulos/04-gastos.md`
  y `09-inicio.md`.

## Pruebas

- **Puros:** meses (cruce de año, inválido, futuro), filas (con y sin descripción, proveedor,
  marcas), fijos (próximo pago con hoy, con `generar_desde`, bimestral, anual y 31; "mañana" y
  "en N días"; falta pagar este mes; resumen de cada frecuencia, fecha pasada y 29 a 31; cambio
  de serie), proveedor, filtros y enlaces, esquemas (fecha futura de un gasto suelto, próximo pago
  posterior a hoy) y ayudas.
- **Base:** `PG208`; cambiar la fecha no vuelve a cargar lo pasado; reactivar con fecha futura;
  la clave del fijo; `gastos_total` por tipo; cargar un gasto y un fijo; editar un fijo con y sin
  cambio de serie; clasificar; las listas (sin clasificar, fijos y pagos de un fijo); RLS de la
  columna nueva (caja e invitado, rechazados).
- **Playwright:** la pantalla entera (los tres bloques, el mes con flechas, las pastillas, la
  categoría que se aplica sola), cargar un gasto con "Ayer", cargar un fijo y verlo en Pagados con
  "Fijo" y en Próximos pagos, editar el próximo pago con el calendario, pausar y reactivar, el
  proveedor que aparece y desaparece con la categoría, la ventana de categorías, clasificar en el
  recuadro, los enlaces de Inicio y las capturas en computadora y celular. Caja e invitado no
  entran a ninguna de las pantallas.

## Fuera de alcance

- El cálculo de "Esta semana vencen N pagos" de Inicio: solo cambia a dónde lleva.
- El calendario nuevo en Ventas, Caja, Reportes y Auditoría: siguen con el del navegador.
- Cuentas a pagar, confirmar pagos, fijos semanales.
- El Excel de Fudo (pedido 59).

## Lo que decidió Claude (para que Santiago lo revise)

- En la computadora, Pagados a la izquierda y Próximos a la derecha; en el celular, Próximos
  arriba.
- "Falta pagar este mes" al pie de Próximos pagos, siempre del mes de hoy.
- "Pausar" en vez de "Desactivar" para un fijo.
- "Ya se cargaron" con los últimos 6 en la pantalla del fijo.
- Pagados no navega a meses futuros, y por eso un gasto suelto no puede tener fecha futura.
- Las direcciones de Recurrentes y Categorías dejan de existir (404); nada las usaba fuera del
  panel.
- Auditoría y Proveedores también dicen "gasto fijo".
- La ficha de un proveedor sigue con sus gastos del año (los primeros 25, con las filas nuevas) y
  pierde "Ver todos sus gastos del año": Gastos ya no filtra por proveedor. Se revisa cuando
  Proveedores deje de estar en "Próximamente".
- `react-day-picker` 10.0.2 (publicada el 2026-09-30).

## Restricciones globales (de `CLAUDE.md`)

- Tests reales: sin mocks ni `vi.mock`/`vi.fn`/`page.route`; lo que toca datos va contra la base
  de pruebas (`*.base.test.ts`); lo puro se prueba llamándolo (`*.test.ts`). La fecha de hoy entra
  como parámetro. Cada test siembra y limpia lo suyo.
- TDD: primero el test, verlo fallar, después el código. Código escrito antes que su test se
  borra.
- Largo: función de `.ts` hasta 20 líneas, componente `.tsx` hasta 80, archivo hasta 300 (ESLint).
  La lógica sale de los `.tsx` a `.ts`.
- Español rioplatense con voseo en pantalla; nombres, comentarios y base en español.
- Plata en centavos enteros (`bigint` / `number` entero, `_centavos`), mostrada como `$1.234,50`.
- Fechas en UTC; el día de un gasto es el día en Argentina.
- Cada operación con la sesión del usuario y RLS; la clave secreta solo para generar los fijos.
  Usuario y local salen de la sesión.
- Nada se borra, se anula; toda escritura deja auditoría.
- Solo Admin entra a Gastos; caja, encargado e invitado reciben rechazo, y las pruebas lo
  comprueban.
- Estética del panel: skill `estetica-panel` (piezas de Plan Reminder Pro, componentes base a mano,
  sin `npx shadcn add`).
- Quién decide: aplicar la migración a la base real, mergear a `main` y publicar los decide
  Santiago.
- Mientras se construye, cada tarea corre sus tests nuevos (Playwright en un solo tamaño) y
  `npm run tipos`; al cerrar, `npm run verificar` y `npm run e2e` enteros.

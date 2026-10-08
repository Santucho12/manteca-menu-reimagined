# Menú digital

Fecha: 2026-10-08. Pedido 25 de `PEDIDOS.md`. Paso 3 del orden de construcción
(`2026-10-06-mapa-fase-1-design.md`). Rama `feat/menu`.

Qué hace el módulo está en `docs/modulos/02-menu.md` y no se repite acá. Este spec dice cómo
se construye. Decisiones de Santiago del 2026-10-08, después de `revision-logica`:

1. Un producto visible nunca queda sin precio. Las tres acciones que pueden dejarlo así
   (cambiarlo de categoría, sacarle una presentación a su categoría, sacar el precio
   compartido) avisan qué productos se van a ocultar y los ocultan al confirmar.
2. El precio de cada presentación es el propio del producto si lo tiene; si no, el
   compartido de la categoría. Se decide presentación por presentación.
3. No se desactiva una categoría con productos activos.
4. El aumento masivo toca todos los precios activos del alcance: compartidos, propios y los
   de productos ocultos.
5. Las fotos van del navegador directo a Supabase Storage, sin pasar por el servidor.
6. Las columnas y el encuadre de la foto se derivan; la foto de la categoría es opcional.
7. El aumento va de -50 % a +200 %. Si el redondeo deja un precio en cero o lo mueve en contra
   del porcentaje, ese precio queda como estaba (se ajustó en la revisión: con un piso de un
   paso, un descuento podía encarecer un precio chico).
8. Un aviso fijo en el panel recuerda cambiar el precio también en Fudo.
9. En `PROPUESTA.md`, "Nombre público, descripción, foto" pasa a "Nombre público y
   descripción. La foto es de la categoría, como en la página actual."
10. Se suma "Reactivar" para categorías y productos desactivados. Lo reactivado vuelve
    oculto.

## Objetivo

Que el dueño cambie el menú él mismo, en menos de un minuto, y que el cliente que escanea el
QR vea siempre el precio correcto. La página pública deja de tener el menú escrito en el
código.

## Enfoque

Cinco tablas nuevas. Toda escritura entra por una función de la base, una por acción, que
comprueba que quien la llama es un admin activo del local y hace todo en una transacción:
muchas acciones tocan varias filas (una categoría con sus presentaciones y su precio
compartido, más los productos que se ocultan) y nada puede quedar a medias. El admin lee las
tablas con RLS; el visitante lee solo una vista pública.

Descartado:

- Precios en una columna JSON del producto: la base no podría validar ni auditar cada precio,
  y la fase 2 cuelga costo y ganancia de cada precio.
- Dos tablas de precios (de categoría y de producto): el precio vigente y el aumento tendrían
  que juntarlas siempre.
- Caché de `/` con `cacheTag` y `updateTag`: exige `cacheComponents`, que cambia el modelo de
  todo el proyecto. `/` lee la base en cada pedido; es una consulta y el cambio se ve al
  guardar. Si el tráfico lo pide, se agrega después.

## Base de datos

Migraciones en `supabase/migrations/`, cada una con su reversa en `supabase/reversas/`, y
`supabase/schema.sql` al día (`migracion-supabase`): tablas, funciones y permisos, y la carga
inicial aparte.

### Tablas

Todas llevan `id` uuid, `local_id`, `fecha_creacion` y `fecha_actualizacion`, el trigger
`marcar_actualizacion` y el trigger genérico `auditar()`.

| Tabla | Columnas | Notas |
|---|---|---|
| `categorias` | `nombre`, `subtitulo` (opcional), `foto` (opcional), `icono`, `orden`, `visible`, `activo` | `icono` sale de una lista fija de 16 emojis, que incluye los 6 de hoy |
| `presentaciones` | `categoria_id`, `nombre`, `orden`, `activo` | Sacar una presentación es desactivarla: sus precios quedan y dejan de mostrarse |
| `productos` | `categoria_id`, `nombre`, `descripcion` (opcional), `etiqueta` (opcional), `orden`, `visible`, `activo` | `etiqueta` es el tipo `etiqueta_de_producto`: `mas_vendido`, `artesanal`, `nuevo` |
| `precios` | `presentacion_id`, `producto_id` (vacío si es el compartido), `monto_centavos`, `activo` | Una sola fila por presentación y producto (`unique nulls not distinct`). Quitar un precio lo desactiva; volver a cargarlo lo reactiva con el monto nuevo |
| `aumentos` | `porcentaje`, `redondeo_centavos`, `categoria_id` (vacío si es todo el menú), `usuario_id` | Una fila por aumento aplicado. Su alta en la auditoría dice quién, cuándo, porcentaje, redondeo y alcance |

Restricciones:

- Nombres de 1 a 100 caracteres; subtítulo hasta 100; descripción hasta 300.
- `monto_centavos` mayor que cero y múltiplo de 100: el público ve pesos enteros.
- `porcentaje` entero entre -50 y 200, distinto de cero. `redondeo_centavos` en 1000, 5000,
  10000 o 50000.
- `foto` es una ruta estática que empieza con `/menu/` (las de la carga inicial) o el nombre
  de un objeto del bucket `fotos-del-menu` que existe y está en la carpeta del local.
- Índices en `local_id`, `categoria_id`, `presentacion_id` y `producto_id`.

### Precio vigente

El precio vigente de una presentación es el monto propio activo del producto o, si no hay, el
compartido activo de la categoría. Solo cuenta si la presentación está activa y es de la
categoría actual del producto. Un producto **tiene precio** si tiene al menos un precio
vigente.

En la base, `tiene_precio(producto)` responde lo segundo para las funciones, y la vista
pública calcula el vigente en su propia definición. En TypeScript, `src/lib/menu/precios.ts`
lo calcula con su origen para el panel.

Al construirlo cambió respecto de este diseño: las funciones de escritura quedaron en tres
migraciones (guardar, acciones y aumento) y la página nueva no trae el botón de WhatsApp,
porque la anterior no lo mostraba y tenía un número de relleno.

### Funciones de escritura

Todas son `security definer`, con `search_path` vacío, ejecutables solo por
`authenticated`. Empiezan comprobando `es_admin_activo()` y que la fila sea del local de
quien llama; si no, `PM100` ("No tenés permiso para hacer esto").

| Función | Qué hace |
|---|---|
| `menu_guardar_categoria(datos jsonb, confirmar boolean)` | Crea o edita: nombre, subtítulo, ícono, foto y la lista ordenada de presentaciones. Cada presentación trae su `id` (vacío si es nueva), su nombre y su precio compartido (vacío si no tiene). Las activas que no vienen se desactivan. Una categoría nueva va última y oculta |
| `menu_guardar_producto(datos jsonb, confirmar boolean)` | Crea o edita: categoría, nombre, descripción, etiqueta, visible y un precio por presentación de la categoría (vacío para heredar). Un producto nuevo va último en su categoría |
| `menu_cambiar_visibilidad(tipo text, id uuid, visible boolean)` | `tipo` es `categoria` o `producto` |
| `menu_mover(tipo text, id uuid, direccion text)` | Cambia el orden con el vecino activo de arriba o de abajo. En el borde no hace nada |
| `menu_desactivar(tipo text, id uuid)` | Desactiva y oculta |
| `menu_reactivar(tipo text, id uuid)` | Reactiva oculto |
| `menu_aplicar_aumento(datos jsonb)` | Recibe porcentaje, redondeo, alcance y cada precio con su monto anterior y el nuevo. Comprueba que la lista sea exactamente la de los precios activos del alcance y que cada anterior coincida con el actual; si no, rechaza todo. Anota el aumento y cambia los montos |

Las dos de guardar devuelven `{ id, ocultados }`, con los nombres de los productos que
ocultaron.

Errores con código propio y el mensaje de la pantalla:

| Código | Cuándo |
|---|---|
| `PM100` | No es admin activo del local |
| `PM101` | El cambio deja productos visibles sin precio y no vino `confirmar`. El detalle trae la lista; la transacción no aplica nada |
| `PM102` | Mostrar un producto sin precio |
| `PM103` | Desactivar una categoría con productos activos. El detalle trae cuáles |
| `PM104` | Reactivar un producto cuya categoría está desactivada |
| `PM105` | Los precios cambiaron desde la vista previa del aumento |
| `PM106` | Mover un producto a una categoría desactivada, o una foto que no existe o no es del local |

Ocultar por falta de precio pasa en las tres acciones del punto 1 de las decisiones: la
función aplica el cambio, busca los productos visibles de las categorías tocadas que quedaron
sin precio y, si hay y no vino `confirmar`, lanza `PM101` con la lista. Con `confirmar`, los
oculta y los devuelve.

### Vista pública

`menu_publico`: una fila por producto visible, activo y con precio, de una categoría
visible y activa del local principal (el más antiguo). Trae de la categoría: id, nombre,
subtítulo, foto, ícono y orden; del producto: id, nombre, descripción, etiqueta y orden; y
`precios`, un JSON con cada presentación activa (nombre, orden, monto vigente o vacío, y si el
monto es el compartido). También trae los precios compartidos de la categoría para armar el
subtítulo.

Es la única lectura de `anon` en todo el esquema. Corre con los permisos de su dueño para
saltear RLS a propósito: filtra lo público en su definición. El aviso de Supabase por eso
queda explicado en el spec y en un comentario de la migración. Nunca trae costos ni nada
oculto.

Cuando exista un segundo local, la vista suma el filtro por dominio; hoy no hace falta.

### Permisos

| Tabla | Quién lee | Quién escribe |
|---|---|---|
| `categorias`, `presentaciones`, `productos`, `precios`, `aumentos` | El admin activo, las de su local | Nadie directo: solo las funciones |
| `menu_publico` | Cualquiera, con o sin sesión | Nadie |

Caja, encargado, invitado, desactivado y el admin del otro local no leen nada de las tablas.

### Storage

Bucket `fotos-del-menu`, de lectura pública (son las fotos del menú), con límite de 10 MB y
solo `image/jpeg`, `image/png` y `image/webp`. Una policy en `storage.objects` deja insertar
solo al admin activo y solo dentro de la carpeta de su local (`<local_id>/<uuid>.<ext>`). Nadie
actualiza ni borra: una foto reemplazada queda guardada.

### Carga inicial

Una migración de datos carga, en el local principal, las 6 categorías de hoy con sus
presentaciones, los 35 productos con sus descripciones y etiquetas ("Popular" pasa a "Más
vendido") y sus precios, todo visible. Facturas tiene precio compartido; sus productos no
tienen precio propio. Las fotos de hoy se copian a `public/menu/` y la categoría guarda esa
ruta. Extras queda sin foto. La migración no hace nada si el local ya tiene categorías.

| Categoría | Ícono | Presentaciones | Foto |
|---|---|---|---|
| Facturas | 🥐 | Docena, Media docena, Unidad (compartido: $20.000, $12.000, $3.000) | `facturas.jpg` |
| Laminados | 🧈 | Unidad | `IMG_0137.JPG.jpeg` |
| Panes | 🍞 | Unidad | `panes.jpg` |
| Clásicos | 🥨 | Por cuarto | `clasicos.jpg` |
| Cafetería | ☕ | Mediano, Grande | `cafe.jpg` |
| Extras | ➕ | Unidad | — |

Los subtítulos de hoy quedan como texto: Laminados "Por unidad", Panes "Por unidad · Hecho con
masa madre", Clásicos "Por cuarto", Cafetería "Mediano / Grande". Facturas no lleva texto: su
subtítulo se arma con los precios.

## Servidor

Servicios en `src/lib/menu/`, que reciben el cliente por parámetro, y acciones en cada
pantalla (`endpoint-staff`). Cada acción valida con Zod (el mismo esquema que el formulario),
exige la sesión de un admin con `src/lib/acceso/` y llama a una función de la base. Los
montos llegan en pesos enteros desde el formulario y se pasan a centavos en el servidor.

| Archivo | Qué tiene |
|---|---|
| `precios.ts` | Precio vigente y su origen (puro) |
| `aumento.ts` | Cálculo del aumento con redondeo al más cercano; nunca cero ni en contra del porcentaje (puro, en enteros) |
| `publico.ts` | Armado del menú público desde las filas de la vista: subtítulo con los precios compartidos, columnas y precios de cada producto (puro) |
| `iconos.ts` | La lista de íconos |
| `esquemas.ts` | Esquemas de Zod de los formularios |
| `errores.ts` | Traducción de `PM100` a `PM106` a mensajes |
| `consultas.ts` | Lectura del panel (categorías con productos y precios, desactivados) y del menú público |
| `escritura.ts` | Llamadas a las funciones de la base |

Las acciones que reciben `PM101` devuelven la lista para que la pantalla pida la
confirmación, y repiten la llamada con `confirmar` si la persona confirma.

La subida de la foto la hace el navegador con su sesión, a `<local_id>/<uuid>.<ext>`, con el
cliente de navegador de `@supabase/ssr` (`src/lib/supabase/navegador.ts`). El formulario manda
solo el nombre del objeto, y la base comprueba que existe y es del local.

## Pantallas

### Menú público (`/`)

Reemplaza la página provisoria. Se reescriben en Next.js, con el mismo aspecto, la portada,
la navegación de categorías, la sección de cada categoría, el bloque final, el pie y el botón
de WhatsApp, cada uno con su prueba primero. Las fotos de la portada y el logo van a
`public/menu/`. Lenis no se trae: el desplazamiento suave es el de CSS.

- Lee `menu_publico` con la clave publicable, en cada pedido.
- Categoría con precio compartido: el subtítulo es "Docena $20.000 · Media docena $12.000 ·
  Unidad $3.000", seguido del texto del subtítulo si lo tiene. El producto muestra solo sus
  precios propios.
- Producto con una presentación: "$4.000". Con varias: una columna por presentación, con "—"
  donde no tiene, como Cafetería hoy.
- Una columna si la categoría tiene dos o más presentaciones activas y no tiene precio
  compartido; si no, dos (en computadora; en el celular siempre una).
- Foto centrada; sin foto, no hay bloque de foto.
- Etiqueta: "🔥 Más vendido", "Artesanal" o "Nuevo", con el estilo de la de hoy.
- Sin nada visible: "Estamos actualizando el menú".

### Administración (solo admin)

La barra del panel suma "Menú". Cada formulario es una página.

| Ruta | Qué tiene |
|---|---|
| `/admin/menu` | Aviso fijo: "Cambiar un precio acá no lo cambia en Fudo: acordate de cambiarlo también allá." Botones "Nueva categoría", "Nuevo producto" y "Aumento de precios". Las categorías en orden, cada una con flechas, la marca "Oculta" y los botones mostrar u ocultar, editar y desactivar; debajo, sus productos con sus precios y el origen ("propio" o "de Facturas"), la etiqueta, la marca "Oculto" y los mismos botones. Al final, "Ver desactivados" |
| `/admin/menu/desactivados` | Categorías y productos desactivados, con "Reactivar" |
| `/admin/menu/categorias/nueva` y `/admin/menu/categorias/[id]` | Nombre, subtítulo, ícono, foto (subir y vista previa), presentaciones (agregar, renombrar, quitar y ordenar con flechas) y la casilla "Precio compartido", con un monto por presentación |
| `/admin/menu/productos/nuevo` y `/admin/menu/productos/[id]` | Nombre, descripción, etiqueta, categoría, un precio por presentación de la categoría (vacío muestra "usa el de la categoría: $3.000" o "sin precio") y "Se muestra en el menú" |
| `/admin/menu/aumento` | Alcance, porcentaje y redondeo ($10, $50, $100 o $500; $100 marcado). "Ver cambios" muestra la tabla con el precio actual y el nuevo, con los ocultos marcados. "Aplicar aumento" aplica exactamente lo que se ve |

Antes de guardar un cambio que oculta productos, aparece "Estos productos se van a ocultar
porque quedan sin precio: …" con "Confirmar" y "Volver". Los errores se explican en voseo:
"Cargale un precio para mostrarlo en el menú", "Primero mové o desactivá estos productos:
…", "Los precios cambiaron mientras mirabas. Revisá los cambios de nuevo."

Componentes de `src/components/ui/` y `src/components/formularios/`, colores y tipografías de
`globals.css`; controles de 44 px en pantallas táctiles, como en Usuarios.

## Pruebas

| Qué | Tipo |
|---|---|
| Precio vigente y origen, aumento (redondeos, piso, límites), armado del menú público (subtítulo, columnas, precios), formato y esquemas | Puros |
| RLS de las cinco tablas con los siete roles de prueba y el visitante, con control positivo; `menu_publico` sin sesión trae lo visible y nada oculto, desactivado, sin precio ni de otro local; Storage: el admin sube a su carpeta, caja, invitado y visitante no (`tests-rls`) | Contra la base |
| Cada función: rechazos por rol y por local, ocultado con y sin confirmar en los tres casos, `PM102` a `PM106`, montos y porcentajes inválidos, orden, y la auditoría de cada una | Contra la base |
| Servicios y acciones: sesión, rol, validación y traducción de errores | Contra la base |
| Como admin: crear categoría con foto y producto y verlos en `/`; cambiar un precio y verlo en `/`; ocultar y mostrar; sacar una presentación, ver el aviso y confirmar; aplicar un aumento después de ver los cambios; desactivar y reactivar; ordenar. Caja e invitado no entran a `/admin/menu`. Capturas de `/` y `/admin/menu` en los dos tamaños, y `/` comparada con la página vieja | En vivo |

Cada test siembra sus categorías y productos con nombres únicos y los borra al terminar con
`clienteSecretoDePruebas()`; la carga inicial de la base de pruebas queda intacta. Las
pruebas en vivo que suben una foto usan un archivo de `e2e/archivos/`.

## Pasos de Santiago

- Aplicar las migraciones a la base real cuando decida, con el OK de siempre.
- Revisar la redacción del punto 9 en `PROPUESTA.md`.
- Mover `mantecabakeryar.com` al sistema cuando el menú nuevo esté publicado y verificado.

## Cuándo está hecho

Pasaron `npm run verificar` y `npm run e2e` en local, contra la base de pruebas, con las
migraciones aplicadas y verificadas en pruebas.

## Fuera de alcance

Lo de "Fuera de alcance" de `docs/modulos/02-menu.md`, y además: sincronizar precios con
Fudo, caché de `/`, recortar o comprimir fotos en el navegador, y el filtro de la vista por
dominio para un segundo local.

## Restricciones globales

Reglas de `CLAUDE.md` que valen para este spec y su plan.

- **Quién decide:** solo Santiago autoriza aplicar una migración a la base real, publicar en
  producción, mergear a `main` y cualquier excepción a las reglas.
- **TDD:** primero el test, verlo fallar y commitearlo; después el código. Código escrito
  antes que su test se borra y se rehace.
- **Tests sin mocks:** contra la base de pruebas. Nada de `vi.mock`, `vi.fn` como reemplazo,
  `page.route` ni clientes falsos. La fecha y el azar entran como parámetro.
- **Hecho es probado en local:** `npm run verificar` y `npm run e2e`, los dos. Mientras se
  construye, cada tarea corre sus tests nuevos (en una pantalla, su archivo de Playwright en un
  solo tamaño) y `npm run tipos`.
- **Largo:** 20 líneas por función en `.ts`, 80 por componente en `.tsx`, 300 por archivo. La
  lógica no vive en los `.tsx`.
- **Idioma:** nombres, comentarios, base y mensajes en español; pantallas en rioplatense con
  voseo.
- **Datos y seguridad:** sesión del usuario y RLS; el usuario y el local salen de la sesión;
  los precios, de la base o del cálculo en el servidor; nada se borra, se desactiva; toda
  escritura deja auditoría; la clave secreta solo en `src/lib/supabase/secreto.ts` y solo
  para lo que permite `CLAUDE.md` (acá, solo los tests).
- **Plata en centavos:** `bigint` en la base, `number` entero en TypeScript, nombres
  terminados en `_centavos` o `Centavos`, nunca punto flotante. Se muestra en pesos enteros
  en el menú y como `$1.234,50` donde haga falta.
- **Estilos:** los colores y tipografías de `globals.css` y los componentes base del proyecto.
- **Bases:** migraciones con `supabase-pruebas`; nunca el servidor MCP `supabase` general.
- **Git:** commits chicos en español, cada archivo con su ruta; a `main` por PR con merge
  commit y el OK de Santiago.

# Reportes: diseño

Pedido 31. Parte de `docs/modulos/08-reportes.md` y de lo decidido con Santiago el 2026-10-11
en la revisión de lógica y en el diseño.

Decisiones:

1. Caja se construye ahora: muestra cada cierre con su empleado y lo declarado, marca los días
   sin cierre y dice "Esperando ventas" donde todavía no hay diferencia. La diferencia aparece
   sola cuando un cierre tenga lo esperado.
2. No se muestra "hasta cuándo están sincronizadas las ventas": entra con la parte de Fudo
   (pedido 30).
3. Por producto: una fila por producto con su monto, y debajo el detalle por presentación con
   su cantidad. Por categoría: monto y cantidad de ventas en que aparece.
4. La comparación se hace sobre el total y sobre las filas que existen en los dos períodos
   (cada producto, categoría o categoría de gasto). Los días o meses no se comparan fila a fila:
   se ven en el gráfico, con los dos períodos superpuestos (día 1 con día 1).
5. Por período: por día si el período tiene hasta 62 días, por mes si es más largo.
6. Los descuentos de Fudo (renglones que no suman el total) se resuelven con la parte de Fudo.
7. Decidido por Santiago el 2026-10-12, después de la revisión: sin fechas, el reporte va del 1
   a hoy. Un período que empieza el día 1 se compara con los mismos días del mes anterior (un mes
   entero, o un día que el mes anterior no tiene, con el mes anterior entero), igual que Inicio.
   Cualquier otro período, con el anterior del mismo largo.

## Base

Una migración, `reportes`, con cuatro funciones `security invoker`, `stable`, con
`set search_path = ''`. Cada una arranca cortando con `42501` si no es un admin activo: Caja
lee sus propios cierres y los gastos de su cierre, y no tiene que ver nada de esto. Las cuatro
filtran por `local_del_usuario()` y las policies existentes ya limitan las filas. Se revocan de
`public` y `anon` y se otorgan a `authenticated`.

| Función | Devuelve | Cuenta |
|---|---|---|
| `reporte_ventas_por_dia(desde date, hasta date)` | `dia date, ventas bigint, monto_centavos bigint` | Ventas cerradas y no anuladas, por `fecha` |
| `reporte_ventas_por_producto(desde date, hasta date)` | `producto_id uuid, producto text, categoria_id uuid, categoria text, presentacion text, cantidad numeric, monto_centavos bigint` | Renglones de ventas cerradas y no anuladas. La categoría es la de hoy del producto. Sin producto: `producto_id` nulo y `producto` = la descripción del renglón |
| `reporte_ventas_por_categoria(desde date, hasta date)` | `categoria_id uuid, categoria text, ventas bigint, monto_centavos bigint` | Igual que la anterior, agrupada por categoría de hoy; `ventas` es la cantidad de ventas distintas. Sin producto: `categoria_id` nulo |
| `reporte_gastos(desde date, hasta date)` | `dia date, categoria_id uuid, categoria text, monto_centavos bigint` | Gastos no anulados, por `fecha` y categoría |

Sin tablas nuevas, sin grants de tablas, sin cambios en policies.

## Lógica pura (`src/lib/reportes/`)

- `periodos.ts`: leer el período y la comparación de la URL (`desde`, `hasta`, `cdesde`,
  `chasta`; sin fechas, del 1 a hoy en Argentina); el período con que se compara (ver decisión 7); los
  atajos (este mes, mes pasado, últimos 7 días) y el enlace de cada uno; días de un período.
- `comparacion.ts`: `variacion(actual, anterior)` devuelve diferencia en centavos y porcentaje
  con un decimal, o `null` si el otro período no tiene datos ("sin datos para comparar");
  `compararFilas` une las filas de los dos períodos por su clave.
- `agrupar.ts`: por día o por mes según el largo (5); serie superpuesta para el gráfico
  (posición 1 con posición 1).
- `ventas.ts`: total, cantidad y ticket promedio (total / cantidad, redondeado a centavos);
  productos agrupados con sus presentaciones; "Sin vincular" para lo que no tiene producto.
- `gastos.ts`: por categoría y por día o mes.
- `resultado.ts`: ventas, gastos por categoría y resultado; sin gastos en el período, el
  resultado no se calcula y se dice "Sin gastos cargados".
- `caja.ts`: filas por día con cierre o sin él (usa `diasSinCierre` de `caja/dias.ts`, desde
  el primer cierre hasta ayer) y resumen por empleado (cierres y suma de diferencias de los que
  la tienen; usa `diferenciaTotalDe`).
- `paginas.ts`: página de una lista ya calculada, de a 50.

## Lectura (`src/lib/reportes/consultas.ts`)

Llama a las funciones con la sesión del usuario y lee los cierres del período con el nombre de
quien los cargó. Cada consulta recibe el cliente y el período.

## Pantallas

| Ruta | Qué |
|---|---|
| `/admin/reportes` | Los siete reportes, cada uno con una línea de lo que responde |
| `/admin/reportes/ventas` | Ventas por período: total, cantidad y ticket promedio con su variación; gráfico de líneas superpuestas; tabla por día o mes con ventas, monto y ticket |
| `/admin/reportes/productos` | Total con variación; barras de los 10 primeros; tabla por producto con monto y variación, y su detalle por presentación con cantidad y monto |
| `/admin/reportes/categorias` | Total con variación; barras; tabla por categoría con ventas, monto y variación |
| `/admin/reportes/gastos` | Gastos por categoría: total con variación; barras; tabla por categoría con monto y variación |
| `/admin/reportes/gastos-por-periodo` | Total con variación; líneas superpuestas; tabla por día o mes |
| `/admin/reportes/caja` | Cierres del período por día (con cierre o "Sin cierre"), empleado, declarado y diferencia o "Esperando ventas"; resumen por empleado; sin comparación |
| `/admin/reportes/resultado` | Ventas, gastos por categoría y resultado, con variación; barras por mes de ventas, gastos y resultado |

Encabezado común (componente): título, desde y hasta, atajos, "Comparar con" (desde y hasta;
vacío es el período de la decisión 7), y la línea "Comparado con el DD/MM al DD/MM".
Período sin datos: "No hay ventas en este período" (o gastos, o cierres) en vez de la tabla.
Gráficos con Recharts (versión exacta en `package.json`) y los colores de `globals.css`.

"Reportes" entra a la barra de Admin después de "Caja". Solo Admin: Caja, Encargado e invitado
reciben el rechazo de siempre.

## Pruebas

- Puros: cada función de `src/lib/reportes/`.
- Base: las cuatro funciones con ventas sembradas (una cerrada de dos renglones, una cancelada,
  una anulada, una de otro día fuera del período) y gastos de dos categorías (uno anulado);
  rechazo para caja, encargado e invitado.
- E2E en los dos tamaños: el admin abre cada reporte con un período sembrado y ve los totales;
  cambia a un atajo; caja no entra.

## Restricciones globales

- TDD estricto: test, verlo fallar, código. Sin mocks: contra la base de pruebas.
- 20 líneas por función en `.ts`, 80 por componente, 300 por archivo. Lógica fuera de `.tsx`.
- Español; pantallas con voseo. Plata en centavos enteros, `$1.234,50`. No se usa "margen".
- Lo cancelado y lo anulado no cuentan. El día es el día en Argentina.
- Solo el admin entra a Reportes; Caja, Encargado e invitado reciben rechazo.
- Solo Santiago autoriza la base real, el merge y publicar.
- Hecho es `npm run verificar` y `npm run e2e` en verde.

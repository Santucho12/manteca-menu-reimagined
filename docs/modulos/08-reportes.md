# Reportes

Módulo 14 de `PROPUESTA.md`. Octavo paso del orden de construcción.

Este archivo tiene dos partes. La definición funcional dice qué hace el módulo y se acordó
con Santiago el 2026-10-06. La parte técnica se escribe al construirlo.

## Para qué

Investigar: entender por qué un mes fue mejor o peor, en qué se fue la plata y dónde no
cierra la caja. Inicio muestra cómo viene el mes; acá se busca el porqué.

## Quién lo usa

Solo Admin.

## Qué reportes hay

| Reporte | Qué muestra |
|---|---|
| Ventas por período | Ventas de cada día, con cantidad de ventas y ticket promedio |
| Ventas por producto | Cantidad y monto de cada producto |
| Ventas por categoría | Cantidad y monto de cada categoría |
| Gastos por categoría | Monto de cada categoría |
| Gastos por período | Gastos de cada día o de cada mes |
| Caja | Diferencia de cada cierre, por día y por empleado |
| Resultado del mes | Ventas, menos gastos abiertos por categoría, igual resultado |

## Cómo funciona cada reporte

- Un filtro de fechas, con atajos: este mes, el mes pasado, los últimos 7 días.
- Una tabla, un gráfico simple y el total.
- Sin fechas elegidas, el reporte va del 1 del mes a hoy.
- La comparación: por defecto, un período que empieza el día 1 se compara con los mismos días
  del mes anterior (el 11 compara del 1 al 11 de cada mes; un mes entero, con el mes anterior
  entero), igual que Inicio. Cualquier otro período, con el anterior del mismo largo. Se puede
  elegir otro período a mano, por ejemplo dos meses.
- Cada número comparado muestra su variación, en pesos y en porcentaje.

## Reglas

1. Los números salen del mismo cálculo que usa Inicio. El mismo dato no da distinto en dos
   pantallas.
2. Lo anulado no cuenta.
3. "El día" es el día calendario en Argentina.
4. Las ventas incluyen las del mostrador y las cargadas a mano (pedido 89).
5. Toda venta tiene sus productos, así que el total por producto y por categoría es igual al de
   Ventas por período. La fila "Sin detalle de productos (Excel de Fudo)" del pedido 84 se sacó
   en el pedido 89.
6. El resultado es ventas menos gastos. No se usa la palabra "margen".
7. Las tablas largas están paginadas.

Desde el pedido 89 las ventas se cargan al cobrar: los reportes ya no dicen hasta cuándo hay
ventas, como hacían mientras entraban por el Excel de Fudo (pedido 84).

## Casos de borde

- Período sin datos: el reporte lo dice, en vez de mostrar una tabla vacía.
- Período de comparación sin datos: la variación no se calcula y se muestra "sin datos para
  comparar".
- Un mes con ventas y sin gastos cargados: el reporte de resultado lo muestra solo con
  ventas, sin resultado.
- Un producto que cambió de categoría: sus ventas se cuentan en la categoría que tiene hoy.
- Un producto desactivado con ventas en el período: aparece igual.
- Un gasto cargado hoy con fecha de un mes anterior: cambia el resultado de ese mes.
- En el reporte de caja, un día sin cierre aparece marcado, y uno marcado como que no abrió
  dice "No abrió" (pedido 85). La diferencia de cada cierre se
  dice como en Caja: "Faltan" o "Sobran" y el monto (pedido 66; sin ventas, lo esperado es $0).

## Fuera de alcance

- Exportar o descargar un reporte.
- Ventas por hora, por día de la semana y por medio de pago.
- Costo, ganancia y rentabilidad por producto.
- Mermas, stock y producción.
- Reportes armados a medida por el usuario.

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Qué reportes | Los de la propuesta, más Resultado del mes |
| Comparación | Del día 1: contra los mismos días del mes anterior (decidido por Santiago el 2026-10-12). Otro período: contra el anterior del mismo largo. O uno elegido a mano |
| Exportar | No |

## Parte técnica

Construido el 2026-10-11 (pedido 31). Diseño en `docs/superpowers/specs/2026-10-11-reportes-design.md`.

### Decisiones al construirlo

- Caja se construye antes que la sincronización con Fudo: muestra lo declarado, los días sin
  cierre (desde el primer cierre hasta ayer) y la diferencia de cada uno. No tiene comparación
  con otro período.
- "Hasta cuándo están sincronizadas las ventas" (regla 7): mientras no esté la API, se muestra
  hasta qué día hay ventas del Excel (pedido 84). Con la API, pasa a la última sincronización.
- Por producto: una fila por producto con su monto y, debajo, la cantidad de cada presentación.
  Lo no vinculado va junto en "Sin vincular", siempre al final.
- La comparación se hace sobre el total y sobre las filas que existen en los dos períodos. Los
  días o meses se comparan en el gráfico, superpuestos (el día 1 con el día 1).
- Por día si el período tiene hasta 62 días; por mes si es más largo.
- En el resultado, si el otro período no tiene gastos, gastos y resultado no se comparan.

### Base

Migración `20261011120000_reportes`: cuatro funciones `security invoker` que arrancan
cortando con `42501` si no es un admin activo (`reportes_exigir_admin`), porque Caja puede
leer sus cierres y los gastos de su cierre.

| Función | Devuelve |
|---|---|
| `reporte_ventas_por_dia(desde, hasta)` | Día, cantidad de ventas y monto, de lo cerrado y sin anular |
| `reporte_ventas_por_producto(desde, hasta)` | Producto, categoría de hoy, presentación, cantidad y monto; sin producto, la descripción del renglón |
| `reporte_ventas_por_categoria(desde, hasta)` | Categoría de hoy (o "Sin vincular"), ventas distintas y monto |
| `reporte_gastos(desde, hasta)` | Día, categoría y monto de los gastos sin anular |

El pedido 84 sumó `ventas_fudo_cargadas_hasta()` y la fila "Sin detalle" con
`reporte_ventas_sin_detalle`; el pedido 89 los sacó (migración
`20261118120100_vender_en_el_mostrador`), porque toda venta se carga al cobrar y con sus
productos.

### Código

- `src/lib/reportes/`: `periodos` (URL, período anterior, atajos), `comparacion` (variación),
  `agrupar` (día o mes, serie superpuesta), `ventas`, `gastos`, `resultado`, `caja`,
  `paginas` (de a 50), `lista` y `consultas` (con la sesión del usuario).
- `src/components/reportes/`: encabezado común, totales, tablas y gráficos de Recharts sin
  animación, con los colores del panel (skill `estetica-panel`).
- Pantallas en `/admin/reportes` y sus siete rutas.
- **Inicio va a usar lo mismo:** `ventasPorDia`, `gastosPorDia`, `totalesDeVentas`,
  `resultadoDelPeriodo` y `resultadoPorMes`, para que el mismo dato no dé distinto.

### Pruebas

- Puros: cada archivo de `src/lib/reportes/`.
- Base: `tests/reglas/reportes.base.test.ts` (lo que devuelven las funciones, lo cancelado,
  lo anulado, lo no vinculado y otro local), `tests/rls/reportes.base.test.ts` (rechazo para
  invitado, caja, encargado, desactivado y visitante) y `tests/servicios/reportes.base.test.ts`.
- En vivo: `e2e/reportes.spec.ts`, con datos de abril de 2018 que siembra
  `e2e/reportes-de-prueba.ts`.

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
- La comparación: por defecto, contra el período anterior del mismo largo. Se puede elegir
  otro período a mano, por ejemplo dos meses.
- Cada número comparado muestra su variación, en pesos y en porcentaje.

## Reglas

1. Los números salen del mismo cálculo que usa Inicio. El mismo dato no da distinto en dos
   pantallas.
2. Lo cancelado y lo anulado no cuentan.
3. "El día" es el día calendario en Argentina.
4. Las ventas incluyen las de Fudo y las cargadas a mano.
5. En los reportes por producto y por categoría, las ventas de productos de Fudo sin
   vincular van en una fila "sin vincular".
6. El resultado es ventas menos gastos. No se usa la palabra "margen".
7. Cada reporte dice hasta cuándo están sincronizadas las ventas.
8. Las tablas largas están paginadas.

## Casos de borde

- Período sin datos: el reporte lo dice, en vez de mostrar una tabla vacía.
- Período de comparación sin datos: la variación no se calcula y se muestra "sin datos para
  comparar".
- Meses anteriores al sistema: tienen ventas (se trae un año de Fudo) pero no gastos. El
  reporte de resultado muestra esos meses solo con ventas, sin resultado.
- Un producto que cambió de categoría: sus ventas se cuentan en la categoría que tiene hoy.
- Un producto desactivado con ventas en el período: aparece igual.
- Un gasto cargado hoy con fecha de un mes anterior: cambia el resultado de ese mes.
- En el reporte de caja, un día sin cierre aparece marcado; un cierre esperando ventas
  aparece sin diferencia.

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
| Comparación | Contra el período anterior del mismo largo, o uno elegido a mano |
| Exportar | No |

## Parte técnica

Se escribe al construir el módulo: las consultas, el cálculo compartido con Inicio y las
pruebas.

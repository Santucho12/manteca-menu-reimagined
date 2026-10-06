# Inicio

Módulo 13 de `PROPUESTA.md` (Dashboard general). Noveno paso del orden de construcción.

Este archivo tiene dos partes. La definición funcional dice qué hace el módulo y se acordó
con Santiago el 2026-10-06. La parte técnica se escribe al construirlo.

## Para qué

Que el dueño abra el sistema y en una pantalla sepa cómo viene el mes y qué tiene que
atender. Sin filtros: para investigar está Reportes.

## Quién lo usa

Solo Admin. Se diseña primero para el celular.

Caja no ve Inicio: entra directo a cargar su cierre. Un invitado ve la pantalla de espera.

## Qué muestra, de arriba hacia abajo

### 1. Lo que requiere acción

Aparece solo si hay algo pendiente. Cada aviso lleva a la pantalla donde se resuelve.

| Aviso | Lleva a |
|---|---|
| Cierres con diferencia sin revisar | Control de cierres |
| Ayer no se cargó el cierre | Control de cierres |
| Personas que esperan un rol | Usuarios |
| Productos de Fudo sin vincular | Vinculación |
| Gastos sin clasificar | Gastos |
| Las ventas no se sincronizan desde hace más de un día | Ventas |

### 2. Los números del mes

Ventas, gastos, resultado y ticket promedio del mes en curso.

Cada uno se compara con **los mismos días del mes anterior**: el día 12 compara del 1 al 12
de este mes contra del 1 al 12 del anterior. Muestra la variación en porcentaje.

### 3. Mes a mes

Un gráfico con las ventas, los gastos y el resultado de los últimos 12 meses.

Los meses anteriores al sistema tienen ventas, porque se trae un año de Fudo, pero no
gastos. Esos meses muestran solo las ventas, sin resultado.

### 4. Más vendidos

Los 5 productos que más plata dejaron en el mes, con la cantidad vendida al lado.

## Reglas

1. Los números salen del mismo cálculo que usa Reportes.
2. Lo cancelado y lo anulado no cuentan.
3. El resultado es ventas menos gastos. No se usa la palabra "margen".
4. Los datos llegan hasta la última sincronización con Fudo, y se muestra de cuándo es.
5. Los avisos no se guardan ni se marcan como vistos: se calculan al abrir la pantalla y
   desaparecen solos cuando se resuelve lo que los causa.
6. Las ventas de productos sin vincular cuentan en los números del mes y no aparecen entre
   los más vendidos.

## Casos de borde

- Primer día del mes: los números están en cero o casi, y la comparación es contra el día 1
  del mes anterior.
- El mes anterior no tiene ese día (el 31): se compara contra el mes anterior completo.
- Sin ventas en el mes: "Más vendidos" dice que todavía no hay ventas.
- Mes anterior sin gastos cargados: gastos y resultado no muestran variación.
- Todo al día: el bloque de avisos no aparece.

## Fuera de alcance

- Filtros y elección de fechas.
- Ventas del día en vivo, al minuto.
- Productos más rentables, mermas del mes y valor del stock.
- Avisos de stock bajo y de margen bajo.
- El centro de avisos: avisos guardados, con estado visto o eliminado.

## Dónde se aparta de la propuesta

| Propuesta | Acá | Por qué |
|---|---|---|
| KPI de margen | Resultado: ventas menos gastos | Sin costos por producto no hay margen |
| Más rentables, mermas y valor del stock | No están | Dependen de Costos, Producción y Stock |
| Alertas de stock bajo y de margen bajo | No están | Dependen de Stock y de Costos |

Falta reflejarlo en `PROPUESTA.md`, con el texto que defina Santiago.

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Período | El mes en curso contra los mismos días del mes anterior |
| Orden | Primero lo que requiere acción, después los números |
| Más vendidos | Los 5 que más plata dejaron, con la cantidad al lado |
| Gráfico | Los últimos 12 meses |

## Parte técnica

Se escribe al construir el módulo: las consultas, el cálculo compartido con Reportes y las
pruebas.

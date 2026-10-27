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

Construido el 2026-10-12 (pedido 33). Diseño en `docs/superpowers/specs/2026-10-12-inicio-design.md`.

### Decisiones al construirlo

- "Productos de Fudo sin vincular", "Las ventas no se sincronizan" y la fecha de la última
  sincronización (regla 4) entran con la parte de Fudo.
- Más vendidos: cada producto con su monto y la cantidad por presentación ("3 Unidad · 2
  Docena"), porque las cantidades de distintas presentaciones no se suman.
- "Ayer no se cargó el cierre" sale todos los días; no se avisa si el local todavía no cargó
  ningún cierre.
- Cada aviso lleva la fecha del caso más viejo: el control de cierres y la lista de gastos
  muestran por defecto solo el mes en curso.

### Avisos

| Aviso | Cuenta | Lleva a |
|---|---|---|
| Cierres con diferencia sin revisar | Cierres en estado `con_diferencia` (revisado y anulado tienen otro estado) | `/admin/caja/control?estado=con_diferencia&desde=…` |
| Ayer no se cargó el cierre | Ayer sin cierre sin anular, con algún cierre anterior | `/admin/caja/control?desde=<ayer>&hasta=<ayer>` |
| Personas esperando un rol | `contarPendientes` | `/admin/usuarios?estado=pendientes` |
| Gastos sin clasificar | Gastos sin anular de la categoría de sistema | `/admin/gastos?categoria=…&desde=…` |

### Código

- `src/lib/inicio/`: `avisos` (la lista de avisos, pura), `meses` (mes en curso, últimos 12
  meses, más vendidos), `numeros` (los cuatro números con su variación) y `consultas`
  (`datosDeAvisos` y `datosDelInicio`, con la sesión del admin).
- Usa el cálculo de Reportes: `datosDelResultado`, `ventasPorProducto`, `periodoAnterior`,
  `resultadoPorMes`, `productosDelReporte` y `comparacionDelResultado`. Sin migración.
- `src/components/inicio/`: `InicioAdmin`, `Avisos`, `MasVendidos`; reusa `Totales` y
  `GraficoPorMes` de Reportes.

### Ayer y vencimientos (pedido 50, 2026-10-27)

- **Ayer**: franja arriba de todo con ventas, tickets, ticket promedio y el cierre (cargado,
  sin cargar o con diferencia, que lleva al control de ese día). Un cierre anulado no cuenta.
  Si ayer no hubo ventas, dice "Ayer no hubo ventas" y no sale el aviso "Ayer no se cargó el
  cierre": un día sin ventas es un día que el local no abrió.
- **Vencen esta semana**: los recurrentes activos cuyo próximo vencimiento cae de hoy a 6
  días, con el mismo cálculo que la lista de Recurrentes, y su total. Sin ninguno, no aparece.
- Código: `src/lib/inicio/ayer.ts` y `vencimientos.ts` (puros); `Ayer.tsx` y
  `Vencimientos.tsx`.

### Pruebas

- Puros: `src/lib/inicio/*.test.ts`.
- Base: `tests/servicios/inicio.base.test.ts` (cada aviso cuenta lo que tiene que contar y no
  lo revisado ni lo anulado; ayer con y sin cierre; los datos del mes).
- En vivo: `e2e/inicio-admin.spec.ts` (el aviso y su enlace, los números, los más vendidos y
  las capturas) y `e2e/acceso.spec.ts` (Caja y el invitado siguen igual).

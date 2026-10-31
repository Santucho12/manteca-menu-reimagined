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
| Cierres con diferencia de la última semana | Control de cierres |
| Ayer no se cargó el cierre | Control de cierres |
| Personas que esperan un rol | Usuarios |
| Productos de Fudo sin vincular | Vinculación |
| Gastos sin clasificar | Gastos |
| Pagos que vencen esta semana | Gastos (Próximos pagos) |
| Las ventas no se sincronizan desde hace más de un día | Ventas |

### 2. Los números del mes

Ventas, gastos, balance y ticket promedio del mes en curso.

Cada uno se compara con **los mismos días del mes anterior**: el día 12 compara del 1 al 12
de este mes contra del 1 al 12 del anterior. Muestra la variación en porcentaje, en verde si
mejora y en rojo si empeora, con una flecha que dice si subió o bajó. En gastos, bajar es
mejorar (Santiago, 2026-10-27).

Al lado de los avisos va el bloque oscuro de ventas del mes: lo vendido, los gastos y el
balance, con una barra de avance que dice qué parte de las ventas queda como balance.

### 3. Mes a mes

Un gráfico con las ventas, los gastos y el balance. Arranca con los últimos 4 meses y se
amplía a todo el año con "Ver todo el año". El mes en curso va más claro, con "en curso".

Los meses anteriores al sistema tienen ventas, porque se trae un año de Fudo, pero no
gastos. Esos meses muestran solo las ventas, sin balance.

### 4. Más vendidos

Los 5 productos que más plata dejaron en el mes, con la cantidad vendida al lado y medallas
de oro, plata y bronce para los tres primeros.

### 5. Esta semana contra la anterior

Un gráfico acumulado: suma las ventas día a día desde hoy y los 6 días anteriores, y las
compara con los 7 días de antes. Una píldora dice si vas arriba o abajo (verde o rojo) y
otra muestra los dos totales.

### 6. Gastos por categoría

Una torta con las 5 categorías que más pesan en el mes y el resto junto en "Otras", con el
porcentaje de cada una.

## Reglas

1. Los números salen del mismo cálculo que usa Reportes.
2. Lo cancelado y lo anulado no cuentan.
3. El balance es ventas menos gastos. En pantalla se dice "balance", no "resultado" ni
   "margen" (Santiago, 2026-10-27).
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
- Mes anterior sin gastos cargados: gastos y balance no muestran variación.
- Sin gastos en el mes: la torta dice que todavía no hay gastos.
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
| KPI de margen | Balance: ventas menos gastos | Sin costos por producto no hay margen |
| Más rentables, mermas y valor del stock | No están | Dependen de Costos, Producción y Stock |
| Alertas de stock bajo y de margen bajo | No están | Dependen de Stock y de Costos |

Falta reflejarlo en `PROPUESTA.md`, con el texto que defina Santiago.

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Período | El mes en curso contra los mismos días del mes anterior |
| Orden | Primero lo que requiere acción, después los números |
| Más vendidos | Los 5 que más plata dejaron, con la cantidad al lado |
| Gráfico | Los últimos 4 meses, ampliable a todo el año (antes, 12 meses fijos) |

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
| Cierres con diferencia de la última semana | Cierres no anulados de los últimos 7 días cuyo resultado contra las ventas es `con_diferencia` | `/admin/caja/control?estado=con_diferencia&desde=…` |
| Ayer no se cargó el cierre | Ayer sin cierre sin anular, con algún cierre anterior | `/admin/caja/control?desde=<ayer>&hasta=<ayer>` |
| Personas esperando un rol | `contarPendientes` | `/admin/usuarios?estado=pendientes` |
| Gastos sin clasificar | Gastos sin anular de la categoría de sistema | `/admin/gastos` (Para clasificar, de cualquier mes; pedido 58) |
| Pagos que vencen esta semana | Fijos activos con próximo vencimiento de hoy a 6 días | `/admin/gastos` (Próximos pagos; pedido 58) |

### Código

- `src/lib/inicio/`: `avisos` (la lista de avisos, pura), `meses` (mes en curso, últimos 12
  meses, más vendidos), `numeros` (los cuatro números con su variación) y `consultas`
  (`datosDeAvisos` y `datosDelInicio`, con la sesión del admin).
- Usa el cálculo de Reportes: `datosDelResultado`, `ventasPorProducto`, `periodoAnterior`,
  `resultadoPorMes`, `productosDelReporte` y `comparacionDelResultado`. Sin migración.
- `src/components/inicio/`: `InicioAdmin`, `Avisos`, `BloqueDelMes`, `TarjetasDelMes`,
  `MesAMes`, `MasVendidos`, `SemanaContraSemana` y `GastosEnTorta`, con
  `EncabezadoDeTarjeta` compartido; reusa `GraficoPorMes` de Reportes. El cartel de los
  gráficos está en `src/components/reportes/estiloDelTooltip.ts`.

### Ayer y vencimientos (pedido 50, 2026-10-27)

- Si ayer no hubo ventas no sale el aviso "Ayer no se cargó el cierre": un día sin ventas es
  un día que el local no abrió.
- Los recurrentes activos cuyo próximo vencimiento cae de hoy a 6 días, con el mismo cálculo
  que la lista de Recurrentes, alimentan el aviso "Esta semana vencen N pagos".
- Se probó una franja "Ayer" arriba de todo y una tarjeta "Vencen esta semana", y Santiago
  las sacó de la pantalla (2026-10-27). Quedó el cálculo en `src/lib/inicio/ayer.ts` y
  `vencimientos.ts` (puros), que usan los avisos.

### Pruebas

- Puros: `src/lib/inicio/*.test.ts`.
- Base: `tests/servicios/inicio.base.test.ts` (cada aviso cuenta lo que tiene que contar y no
  lo revisado ni lo anulado; ayer con y sin cierre; los datos del mes).
- En vivo: `e2e/inicio-admin.spec.ts` (el aviso y su enlace, los números, los más vendidos y
  las capturas) y `e2e/acceso.spec.ts` (Caja y el invitado siguen igual).

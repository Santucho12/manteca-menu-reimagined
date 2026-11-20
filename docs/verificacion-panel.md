# Verificación funcional del panel

Con la skill `verificacion-funcional`, contra `mantecatest` (la base de esta computadora,
`CLAUDE.local.md`). Detecta y no arregla: cada hallazgo trae su reproducción y el fix va
como propuesta. Empezada el 2026-11-19 por pedido de Santiago («hacelo con todos los
módulos»), en orden de riesgo: primero donde se mueve plata.

## Módulos

| Módulo | Estado | Pasadas | Hallazgos |
|---|---|---|---|
| Vender en el mostrador | ✅ verificado 2026-11-19 | 6 (cerró en la 6) | 1, 2 |
| Cierres de caja | ✅ verificado 2026-11-19 | 6 (cerró en la 6) | 3, 4, 5 |
| Ventas — lista y carga a mano | ✅ verificado 2026-11-19 | 6 (cerró en la 6) | 6 |
| Gastos | ✅ verificado 2026-11-19 | 6 (cerró en la 6) | 7 |
| Compras | ✅ verificado 2026-11-19 | 6 (cerró en la 6) | 5, 7, 8 |
| Costos | ✅ verificado 2026-11-19 | 6 (cerró en la 6) | 9 |
| Materia prima | ✅ verificado 2026-11-19 | 6 (cerró en la 6) | 9 (de Costos) |
| Inicio | ✅ verificado 2026-11-19 | 6 (cerró en la 6) | 10 |
| Reportes | ✅ verificado 2026-11-19 — **sin hallazgos** | 6 | — |
| Auditoría | ✅ verificado 2026-11-19 — **sin hallazgos** | 6 | — |
| Proveedores | ✅ verificado 2026-11-19 — **sin hallazgos** | 6 | — |
| Menú | ✅ verificado 2026-11-19 — **sin hallazgos** | 6 | — |
| Usuarios y permisos | ✅ verificado 2026-11-19 — **sin hallazgos** | 6 | — |

## Registro de criterios

| Criterio | Cómo lo resuelve | Visto en | Estado |
|---|---|---|---|
| Qué es «una venta» para sumar | `estado = 'cerrada'` y no anulada | Reportes (por día, producto, tipo), Ganancia por producto, `ventas_totales`, `cierres_con_resultado` | — |
| Qué es «el día» de una venta del mostrador | `caja_estado_del_turno(now()).fecha`, no la fecha del navegador | `ventas_guardar_mostrador` | — |
| Qué venta suma a lo esperado de la caja | `en_la_caja`; el mostrador la marca siempre | `ventas_guardar_mostrador`, cierres | ver #2 |
| Qué ventas espera cada cierre | las de su día y su turno, cerradas, sin anular, por medio | `cierres_con_resultado` | — |
| Qué turno toma un cierre | el de la fecha pedida en la dirección; uno anterior a hoy, la noche | `cierreACargar` | ver #4 |
| Precio que se cobra | el del menú, leído en la base: propio del producto o el de la categoría | `ventas_renglones_del_mostrador`, Costos (`precioDe`) | — |

## Hallazgos

- [x] **1 · 🔵 La definición dice que en el mostrador el tipo de venta es siempre Local, y
  la pantalla deja elegirlo.** `docs/modulos/05-ventas.md`, regla 5 del mostrador, contra
  `src/app/admin/(panel)/vender/ElegirTipo.tsx` y `ventas_tipo_del_mostrador`, que acepta el
  tipo que manda la pantalla. Se eligió así en el pedido 90.
  repro: abrir `/admin/vender` con más de un tipo activo: aparece «Tipo de venta».
  Documentación · fix propuesto: actualizar la regla 5 («viene Local y se puede cambiar»).
  **Arreglado el 2026-11-19: la regla 5 de `docs/modulos/05-ventas.md` dice que el tipo viene Local y se puede cambiar.**
- [x] **2 · 🟡 Una venta del mostrador con otro tipo (por ejemplo PedidosYa) igual cuenta
  como cobrada en la caja.** `ventas_guardar_mostrador` guarda siempre `en_la_caja = true`.
  Si un pedido de PedidosYa se pagó por la aplicación, la plata no entró a la caja y el
  cierre lo esperaría igual.
  repro: el código de la función (`insert ... en_la_caja ... values (..., true, ...)`).
  **Criterio del usuario**, sin decidir: (a) está bien, porque en el mostrador todo se cobra
  en la caja; (b) el mostrador pregunta si se cobró en la caja cuando el tipo no es Local;
  (c) cada tipo dice si se cobra en la caja.

- [x] **3 · 🔵 Un test de la base quedó viejo y deja la suite en rojo.**
  `tests/reglas/cierre-por-tipo.base.test.ts:203` («un tipo que no se controla no se anota»)
  usa Encargo, que desde `20261119150000_todos_los_tipos_se_controlan` se controla: ya no da
  `PC311`. La regla anda; el test no.
  repro: `npx vitest run tests/reglas/cierre-por-tipo.base.test.ts` (rojo).
  Test · fix propuesto: probar el rechazo con Local, el único tipo que no se controla.
  **Arreglado el 2026-11-19: el test prueba el rechazo con Local; `tests/reglas/cierre-por-tipo.base.test.ts` en verde (13).**
- [x] **4 · 🟠 Al cargar un cierre atrasado cambiando la fecha en el formulario, el turno no
  la sigue: queda el turno de hoy.** `src/app/admin/(panel)/caja/page.tsx:35` elige el turno
  (y el fondo sugerido) con `cierreACargar` según la fecha de la dirección; para un día
  anterior, la noche. El campo Fecha cambia la fecha en el cliente sin volver a pedir el
  turno ni el fondo, así que un cierre de ayer cargado a la mañana queda como Mediodía.
  repro: `e2e/caja.spec.ts:78` y `e2e/caja.spec.ts:140` en computadora (rojo): el cierre del
  día sembrado queda «Mediodía» y, con las ventas en la noche, muestra «Sobran $15.000,00»
  en vez de «Cierra».
  Bug · fix propuesto: al cambiar la fecha, navegar a `?fecha=` (como ya hace
  `ElegirTurno` con el turno) para que el servidor elija turno y fondo.
  **Arreglado el 2026-11-19 (`063179d`): cambiar la fecha va a `?fecha=` (`destinoDeLaFecha`, con test puro) y el formulario se rearma con la fecha y el turno (`key`); `e2e/caja.spec.ts` en verde (16) y las otras 4 pruebas en vivo de cierres (25).**
- [x] **5 · 🟠 Anular un cierre deja viva la compra armada sobre su gasto de caja.** Al anular
  el cierre, su gasto se anula (`manteca.anulando_cierre`), pero la compra que se armó con
  «Es una compra» sigue recibida y el insumo sigue tomando su precio.
  repro: `tests/verificacion/cierre-anulado-con-compra.base.test.ts` → `it.skip('#5 · …')`
  (rojo sin el skip: la compra queda `anulado = false`).
  **Criterio del usuario**, sin decidir: (a) anular el cierre anula también la compra;
  (b) la compra queda y pasa a «sin pago», con aviso; (c) no se anula un cierre con un gasto
  pasado a compra sin anular antes la compra.

  **Arreglado el 2026-11-19 (`4371870`), con la opción (a), por decisión de Claude («lo que creas mejor»): si el gasto de una compra se anula por su cierre (al anularlo o editarlo), la compra se anula con él (`anular_compra_del_gasto`). La prueba quedó sin skip y en verde.**
- [x] **6 · 🟡 Una prueba en vivo depende de un dato que no siembra y lo borra.**
  `e2e/ventas-canales.spec.ts:69` toca «Borrar Cheaf» suponiendo que Cheaf tiene ventas y
  que entonces pide desactivarlo. En una base donde Cheaf no tiene ventas (mantecatest), lo
  borra de verdad: el 2026-11-19 se borró el Cheaf de Manteca y hubo que volver a crearlo,
  porque otros tests lo buscan por nombre (`idDeCanal('Cheaf')`).
  repro: correr `e2e/ventas-canales.spec.ts` en una base sin ventas de Cheaf (rojo en la
  línea 80, y Cheaf desaparece).
  Test · fix propuesto: que la prueba siembre su propio tipo con una venta y borre ese.

  **Arreglado el 2026-11-19: la prueba siembra un tipo propio con una venta y borra ese; 9 en verde y Cheaf intacto.**
- [x] **7 · 🟠 Desde Gastos se anula el gasto de una compra y la compra sigue viva.**
  `reglas_de_gastos` no mira `compra_id`: el gasto pagado que generó una compra se anula
  (o se le cambia el monto) suelto, y la compra queda «Pagada», recibida, y el insumo sigue
  tomando su precio. Igual con «No se paga» sobre lo por pagar de una compra.
  repro: `tests/verificacion/gasto-de-compra-anulado.base.test.ts` → `it.skip('#7 · …')`
  (rojo sin el skip: el gasto se anula y la compra queda `anulado = false`).
  Bug · fix propuesto: el gasto y lo por pagar de una compra no se anulan ni cambian el
  monto sueltos (un código nuevo, «anulá la compra»); o anularlos anula la compra.

  **Arreglado el 2026-11-19 (`4371870`): el gasto y lo por pagar de una compra no se anulan ni cambian el monto sueltos (`PG212`, «Es el gasto de una compra: anulá la compra desde Compras.»); `compras_anular` los anula. Prueba sin skip y en verde, con el mensaje.**
- [x] **8 · 🔵 Un pedido anulado aparece arriba de la lista, con los pedidos por recibir.**
  `src/lib/compras/consultas.ts` ordena por `estado` y la anulación no es un estado: en
  «Todas», un pedido anulado queda junto a los que esperan recibirse.
  repro: armar un pedido, anularlo y abrir `/admin/compras`: queda primero, «Anulada».
  Mejora · fix propuesto: ordenar primero los pedidos sin anular.

  **Arreglado el 2026-11-19: lo anulado va al final; `tests/verificacion/compras-orden.base.test.ts` (rojo antes, verde después).**
- [x] **9 · 🟠 Una receta con un insumo desactivado lo muestra vacío y no se puede volver a
  guardar.** `src/lib/costos/receta.ts` (`insumosParaReceta`) ofrece solo los insumos
  activos y `FormularioDeReceta` arma el desplegable con esa lista: el renglón del insumo
  desactivado queda en «Elegí un insumo», sin marca, y al guardar pide elegir uno. La regla 2
  de `docs/modulos/10-materia-prima.md` dice que las recetas que ya lo tenían lo siguen
  usando y lo muestran marcado. La base sí lo acepta (`recetas_guardar` deja seguir un
  insumo desactivado que ya estaba).
  repro: `e2e/verificacion-receta-con-insumo-desactivado.spec.ts` →
  `test.skip('#9 · …')` (rojo sin el skip: el desplegable vale `""` en vez del insumo).
  Bug · fix propuesto: sumar a las opciones los insumos que ya están en la receta, con
  «(desactivado)» en el texto.

  **Arreglado el 2026-11-19 (`ed01548`): la receta suma el insumo desactivado que ya tenía, con «(desactivado)» y el aviso «Desactivado en Materia prima»; la prueba en vivo quedó sin skip y en verde, y se puede volver a guardar.**
- [x] **10 · 🟡 Dos pruebas en vivo de Inicio dependen de un historial de ventas que no
  siembran.** `e2e/inicio-admin.spec.ts:295` espera 12 barras (4 meses × 3 series) y
  `e2e/inicio-montos.spec.ts:6` espera la variación contra el mes anterior. En una base sin
  meses anteriores en el local (mantecatest: las ventas inventadas están en el Local de
  ejemplo) dan 6 barras y ninguna variación. La pantalla está bien: un mes en cero no tiene
  barra y sin mes anterior no hay variación.
  repro: correr esas dos pruebas en mantecatest (rojo: «Expected 12, Received 6» y la
  variación sin encontrar).
  Test · fix propuesto: que cada prueba siembre los meses que necesita, o que corra con la
  sesión del Local de ejemplo.

  **Arreglado en parte el 2026-11-19: las dos pruebas siembran sus meses (`tests/historial-de-prueba.ts`); el mes a mes pasa. La de las tarjetas sigue en rojo por otra causa: el rediseño de estética sacó de las tarjetas la variación contra el mes anterior, y esa prueba la tiene que poner al día el rediseño.**
## Verificado y sano

- **Vender en el mostrador:** venta idempotente por clave (el doble toque guarda una sola);
  traba a la hora del cierre antes de validar; precio del menú leído en la base y rechazo
  si cambió con el ticket armado; producto, categoría y presentación activos; cantidades
  enteras desde 1; uno o dos medios distintos, cada uno mayor que cero, que suman el total.
  En `mantecatest`, las 3812 ventas cerradas cuadran: total = renglones = pagos. Anular una
  venta la saca de las ventas por día, por producto, la ganancia, los totales de Ventas y lo
  esperado en efectivo del cierre de su turno.

- **Cierres de caja:** lo esperado de cada turno suma sus ventas por medio, sin anuladas
  ni canceladas, y el mediodía no mezcla la noche
  (`tests/verificacion/cierres-esperado.base.test.ts`); anular un cierre anula sus gastos
  y pide motivo; un turno por cierre; la noche no va antes que el mediodía de hoy; todos
  los tipos se controlan salvo Local.

- **Ventas, lista y carga a mano:** 7 archivos de base (47 en verde: reglas, RLS, totales
  por tipo, quién la cargó, borrar un tipo) y 23 de 24 pruebas en vivo de Ventas y Tipos de
  venta. Anular una venta la saca de todos los números (la misma prueba que el mostrador,
  `tests/verificacion/vender-anular.base.test.ts`).

- **Gastos:** 10 archivos de base (106 en verde: reglas, RLS, recurrentes, por pagar,
  repetidos, por categoría) y 40 pruebas en vivo de Gastos, Fijos, Por pagar y Categorías
  en computadora, todas en verde.

- **Compras:** 27 de base en verde (recibir con total, gasto y por pagar; pedir y recibir;
  bonificación; doble envío; anular y volver al precio anterior; armar sobre un gasto de caja
  y devolverlo a Sin clasificar; RLS) y las 9 pruebas en vivo en computadora, después de
  que la prueba esperara la carga de la página (`e2e/compras.spec.ts`: se eligía el
  proveedor antes de que React cargara; la prueba se corrigió, la pantalla no tenía nada).

- **Costos:** 46 de base en verde, con los dos que no habían corrido (volver a la receta
  del producto, ganancia de lo vendido); 10 pruebas en vivo en computadora en verde, después
  de corregir tres errores de la prueba (esperar la carga, la etiqueta exacta «Insumo 1» y
  elegir el insumo por su id); el costo con desperdicio, rinde, unidades y agregado; la
  receta propia; el precio del menú igual que el del mostrador.

- **Materia prima:** 52 de base en verde (RLS, reglas, costo por referencia y por compra,
  servicio); 12 pruebas en vivo y `e2e/verificacion-insumo-en-recetas.spec.ts` (la columna
  «En recetas» y las recetas en la ficha) en verde.

- **Inicio:** `tests/servicios/inicio.base.test.ts` (10 en verde: avisos, resultado, más
  vendidos, semana) y 30 de 32 pruebas en vivo de Inicio en computadora; el aviso de
  productos debajo del mínimo sale de la misma lista que Costos (`cuantosDebajoDelMinimo`,
  probado en `tests/servicios/costos.base.test.ts`); el resultado del mes usa el mismo
  cálculo que Reportes.

- **Reportes:** 7 archivos de base (32 en verde, con la ganancia de lo vendido y los
  reportes largos que se piden de a tandas) y 20 pruebas en vivo; el reporte Ganancia por
  producto abre y muestra ganancia y porcentaje
  (`e2e/verificacion-reporte-de-ganancia.spec.ts`).

- **Auditoría, Proveedores, Menú y Usuarios:** 25 archivos de base (249 en verde: RLS de
  cada tabla, roles, contraseñas temporales, primera cuenta, menú público, fotos, aumentos,
  auditoría con valor anterior y nuevo, nombres de las tablas nuevas) y 96 pruebas en vivo
  en computadora (auditoría, proveedores, menú, usuarios, cuenta, registro y acceso), todas
  en verde. Ya estaban verificados en octubre; esta pasada confirma que lo de noviembre no
  los rompió.

## Descartado — NO re-proponer

| # | Qué se propuso | Por qué NO | Cuándo |
|---|---|---|---|
| 2 | Que el mostrador pregunte si se cobró en la caja cuando el tipo no es Local | Decidido por Claude («lo que creas mejor»): en el mostrador todo entra por la caja, y el cierre por tipo de venta (pedido 99) ya controla aparte cada tipo que no es Local. Santiago puede reabrirlo | 2026-11-19 |

## Vender en el mostrador · pasadas

| # | Lente | Qué ejercité | Hallazgos |
|---|---|---|---|
| 1 | Cadena | `ventas_guardar_mostrador` y sus cuatro funciones (tipo, validar, renglones, pagos), la acción y el esquema de `src/lib/vender` | 1 |
| 2 | Ejecución | `tests/servicios/vender.base.test.ts`, `tests/rls/vender.base.test.ts`, `tests/servicios/caja-con-el-mostrador.base.test.ts` (23 en verde) y `e2e/vender.spec.ts` en computadora (12 en verde) | — |
| 3 | Números y bordes | SQL: total contra renglones y contra pagos en las 3812 ventas cerradas (0 diferencias); validación de pagos (cero, repetido, de más) leída contra la función | — |
| 4 | Criterios | «una venta», «el día» y el precio, anotados en el registro | — |
| 5 | Lógica por actor | caja vende sin ver lo vendido; admin entra desde Ventas; el tipo elegible | 2 |
| 6 | Reversa y propagación | `tests/verificacion/vender-anular.base.test.ts`: vender, medir 5 números, anular, medir (verde) | — → **cierra** |

## Cierres de caja · pasadas

| # | Lente | Qué ejercité | Hallazgos |
|---|---|---|---|
| 1 | Cadena | `cierres_guardar` (turno, `PC301`, `PC309`), `cierreACargar`, `ElegirTurno`, el formulario | — |
| 2 | Ejecución | 17 archivos de base de cierres y caja (156 de 158 en verde) y 5 pruebas en vivo de Caja en computadora (35 de 37) | 3, 4 |
| 3 | Números y bordes | `tests/verificacion/cierres-esperado.base.test.ts`: lo esperado por turno y medio con anuladas y canceladas (verde) | — |
| 4 | Criterios | «qué ventas espera un cierre» y «qué turno toma», contra Vender | 4 |
| 5 | Lógica por actor + auto-revisión | caja carga a ciegas; el día sin abrir que falló pasa aislado (datos compartidos, no hallazgo) | — |
| 6 | Reversa y propagación | anular un cierre con un gasto pasado a compra (rojo) | 5 |
| 7 | Lente nueva: los 2 rojos de la prueba en vivo, uno por uno con sus capturas | ambos son el #4, no fallas aparte | — → **cierra** |

## Ventas — lista y carga a mano · pasadas

| # | Lente | Qué ejercité | Hallazgos |
|---|---|---|---|
| 1 | Cadena | carga a mano (fecha no futura, en la caja con su turno), anular con motivo, tipos de venta | — |
| 2 | Ejecución | 7 archivos de base (47 en verde) y `e2e/ventas.spec.ts` + `e2e/ventas-canales.spec.ts` en computadora (23 de 24) | 6 |
| 3 | Números y bordes | totales que siguen al filtro de tipo (`ventas-por-tipo.base.test.ts`), total = renglones = pagos en las 3812 ventas | — |
| 4 | Criterios | «una venta» y lo esperado de la caja, iguales a Vender y Cierres | — |
| 5 | Lógica por actor + auto-revisión | el rojo de la prueba en vivo era la prueba, no la pantalla: con ventas, Cheaf pide desactivar | — |
| 6 | Reversa y propagación | anular saca la venta de reportes, ganancia, totales y caja (ver Vender) | — → **cierra** |

## Gastos · pasadas

| # | Lente | Qué ejercité | Hallazgos |
|---|---|---|---|
| 1 | Cadena | `reglas_de_gastos` (anulado, de caja, medio, categoría y proveedor, la salida de Compras), lo por pagar y su pago | 7 |
| 2 | Ejecución | 10 archivos de base (106 en verde) y 4 pruebas en vivo en computadora (40 en verde) | — |
| 3 | Números y bordes | totales por categoría y por mes, por pagar, repetidos (`gastos-por-categoria`, `gastos-por-pagar`, `gasto-repetido`) | — |
| 4 | Criterios | «un gasto cuenta el día que se paga» y lo anulado fuera, iguales en Reportes y Compras | — |
| 5 | Lógica por actor | Mercadería a mano avisa que no cambia precios; un gasto de caja se clasifica, no se anula suelto | — |
| 6 | Reversa y propagación | anular el gasto de una compra (rojo) | 7 → **cierra** |

## Compras · pasadas

| # | Lente | Qué ejercité | Hallazgos |
|---|---|---|---|
| 1 | Cadena | `compras_recibir`, `compras_pedir`, `compras_desde_gasto`, `compras_anular`, las acciones y los esquemas | — |
| 2 | Ejecución | 27 de base y `e2e/compras.spec.ts` en computadora (9 en verde tras corregir la espera de la prueba) | — |
| 3 | Números y bordes | total = renglones + otros cargos, gasto y por pagar con el total, bonificación a $0, renglones de más en un gasto de caja (`PU307`) | — |
| 4 | Criterios | el precio del insumo: la última compra recibida por fecha de compra, contra Costos y Materia prima | — |
| 5 | Lógica por actor | la lista del mes con pedidos arriba | 8 |
| 6 | Reversa y propagación | anular un cierre con su gasto de caja pasado a compra (#5) y anular desde Gastos el gasto de una compra (#7) | 5, 7 → **cierra** |

## Costos · pasadas

| # | Lente | Qué ejercité | Hallazgos |
|---|---|---|---|
| 1 | Cadena | `recetas_guardar`, `recetas_usar_la_del_producto`, `costos_de_productos`, las acciones, el formulario de la receta y Ajustes | — |
| 2 | Ejecución | 4 archivos de base (46 en verde) y `e2e/costos.spec.ts` (10 en verde tras corregir la prueba) | — |
| 3 | Números y bordes | costo con desperdicio y rinde, redondeo a la mitad, receta propia más agregado, sugerido a $100, el mínimo justo | — |
| 4 | Criterios | precio del menú (propio o de la categoría) igual en Costos y en el mostrador; el costo de la venta sale de la misma función | — |
| 5 | Lógica por actor | Ajustes avisa que cambiar una presentación cambia toda la categoría; el margen fuera de rango se explica | — |
| 6 | Reversa y propagación | desactivar un insumo que está en una receta (rojo en la pantalla) | 9 → **cierra** |

## Materia prima · pasadas

| # | Lente | Qué ejercité | Hallazgos |
|---|---|---|---|
| 1 | Cadena | insumos y formas de compra, `formas_de_compra_reglas` (`PI301`, `PI302`), `insumos_reglas` (`PI303`), `costo_de_insumos` | — |
| 2 | Ejecución | 3 archivos de base (52 en verde), `e2e/materia-prima.spec.ts` (12) y la prueba nueva de recetas en la ficha | — |
| 3 | Números y bordes | costo por kilo, litro y unidad, redondeo, la forma cambiada por última vez, la forma desactivada fuera | — |
| 4 | Criterios | el precio del insumo, igual en Materia prima, Costos y Compras | — |
| 5 | Lógica por actor | el nombre repetido avisa y deja seguir; la unidad no cambia si está en una receta | — |
| 6 | Reversa y propagación | desactivar un insumo que está en una receta: su receta lo pierde de vista (es el #9, de Costos) | 9 → **cierra** |

## Inicio · pasadas

| # | Lente | Qué ejercité | Hallazgos |
|---|---|---|---|
| 1 | Cadena | `datosDelInicio` y cada consulta que junta, con el aviso de margen nuevo | — |
| 2 | Ejecución | `tests/servicios/inicio.base.test.ts` (10) y 4 pruebas en vivo de Inicio en computadora (30 de 32) | 10 |
| 3 | Números y bordes | los 2 rojos uno por uno: el mes en cero sin barra y sin mes anterior sin variación es lo correcto | — |
| 4 | Criterios | «ventas del mes» igual a Reportes (`datosDelResultado`); «debajo del mínimo» igual a Costos | — |
| 5 | Lógica por actor | caja no ve Inicio de admin; cada aviso lleva a donde se resuelve | — |
| 6 | Reversa y propagación | una venta anulada sale de los números que comparte con Reportes (ver Vender) | — → **cierra** |

## Reportes · pasadas

| # | Lente | Qué ejercité | Hallazgos |
|---|---|---|---|
| 1 | Cadena | cada reporte y su función, `reportes_exigir_admin`, la lista y el período | — |
| 2 | Ejecución | 7 archivos de base (32) y `e2e/reportes.spec.ts` (20), más el reporte de ganancia abierto en la pantalla | — |
| 3 | Números y bordes | ganancia sobre lo que tiene costo y lo que no aparte; 2 × $1.000 con costo $350 da $1.300 y 65 % | — |
| 4 | Criterios | «una venta» igual en todos los reportes, Inicio, Ventas y Cierres | — |
| 5 | Lógica por actor | caja no ve reportes (`42501`) | — |
| 6 | Reversa y propagación | la venta anulada sale de por día, por producto y ganancia (ver Vender) | — → **cierra** |

## Auditoría, Proveedores, Menú y Usuarios · pasadas

| # | Lente | Qué ejercité | Hallazgos |
|---|---|---|---|
| 1 | Cadena | las acciones de cada módulo y sus RLS, con lo que les sumaron Compras y Costos | — |
| 2 | Ejecución | 25 archivos de base (249) y 96 pruebas en vivo en computadora | — |
| 3 | Números y bordes | aumentos de precios, totales pagados por proveedor, primera cuenta | — |
| 4 | Criterios | «desactivado» oculto en lo nuevo y visible en el historial (proveedor, insumo) | — |
| 5 | Lógica por actor | invitado, caja, encargado y desactivado reciben rechazo; admin de otro local no ve nada | — |
| 6 | Reversa y propagación | desactivar un proveedor deja sus compras y gastos; desactivar un producto lo saca de Vender | — → **cierra** |

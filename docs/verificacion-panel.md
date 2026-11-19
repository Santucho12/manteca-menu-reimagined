# Verificación funcional del panel

Con la skill `verificacion-funcional`, contra `mantecatest` (la base de esta computadora,
`CLAUDE.local.md`). Detecta y no arregla: cada hallazgo trae su reproducción y el fix va
como propuesta. Empezada el 2026-11-19 por pedido de Santiago («hacelo con todos los
módulos»), en orden de riesgo: primero donde se mueve plata.

## Módulos

| Módulo | Estado | Pasadas | Hallazgos |
|---|---|---|---|
| Vender en el mostrador | ✅ verificado 2026-11-19 | 6 (cerró en la 6) | 1, 2 |
| Cierres de caja | ⬜ pendiente | — | — |
| Ventas — lista y carga a mano | ⬜ pendiente | — | — |
| Gastos | ⬜ pendiente | — | — |
| Compras | ⬜ pendiente | — | — |
| Costos | ⬜ pendiente | — | — |
| Materia prima | ⬜ pendiente | — | — |
| Inicio | ⬜ pendiente | — | — |
| Reportes | ⬜ pendiente | — | — |
| Auditoría | ⬜ pendiente | — | — |
| Proveedores | ⬜ pendiente | — | — |
| Menú | ⬜ pendiente | — | — |
| Usuarios y permisos | ⬜ pendiente | — | — |

## Registro de criterios

| Criterio | Cómo lo resuelve | Visto en | Estado |
|---|---|---|---|
| Qué es «una venta» para sumar | `estado = 'cerrada'` y no anulada | Reportes (por día, producto, tipo), Ganancia por producto, `ventas_totales`, `cierres_con_resultado` | — |
| Qué es «el día» de una venta del mostrador | `caja_estado_del_turno(now()).fecha`, no la fecha del navegador | `ventas_guardar_mostrador` | — |
| Qué venta suma a lo esperado de la caja | `en_la_caja`; el mostrador la marca siempre | `ventas_guardar_mostrador`, cierres | ver #2 |
| Precio que se cobra | el del menú, leído en la base: propio del producto o el de la categoría | `ventas_renglones_del_mostrador`, Costos (`precioDe`) | — |

## Hallazgos

- [ ] **1 · 🔵 La definición dice que en el mostrador el tipo de venta es siempre Local, y
  la pantalla deja elegirlo.** `docs/modulos/05-ventas.md`, regla 5 del mostrador, contra
  `src/app/admin/(panel)/vender/ElegirTipo.tsx` y `ventas_tipo_del_mostrador`, que acepta el
  tipo que manda la pantalla. Se eligió así en el pedido 90.
  repro: abrir `/admin/vender` con más de un tipo activo: aparece «Tipo de venta».
  Documentación · fix propuesto: actualizar la regla 5 («viene Local y se puede cambiar»).
- [ ] **2 · 🟡 Una venta del mostrador con otro tipo (por ejemplo PedidosYa) igual cuenta
  como cobrada en la caja.** `ventas_guardar_mostrador` guarda siempre `en_la_caja = true`.
  Si un pedido de PedidosYa se pagó por la aplicación, la plata no entró a la caja y el
  cierre lo esperaría igual.
  repro: el código de la función (`insert ... en_la_caja ... values (..., true, ...)`).
  **Criterio del usuario**, sin decidir: (a) está bien, porque en el mostrador todo se cobra
  en la caja; (b) el mostrador pregunta si se cobró en la caja cuando el tipo no es Local;
  (c) cada tipo dice si se cobra en la caja.

## Verificado y sano

- **Vender en el mostrador:** venta idempotente por clave (el doble toque guarda una sola);
  traba a la hora del cierre antes de validar; precio del menú leído en la base y rechazo
  si cambió con el ticket armado; producto, categoría y presentación activos; cantidades
  enteras desde 1; uno o dos medios distintos, cada uno mayor que cero, que suman el total.
  En `mantecatest`, las 3812 ventas cerradas cuadran: total = renglones = pagos. Anular una
  venta la saca de las ventas por día, por producto, la ganancia, los totales de Ventas y lo
  esperado en efectivo del cierre de su turno.

## Descartado — NO re-proponer

| # | Qué se propuso | Por qué NO | Cuándo |
|---|---|---|---|

## Vender en el mostrador · pasadas

| # | Lente | Qué ejercité | Hallazgos |
|---|---|---|---|
| 1 | Cadena | `ventas_guardar_mostrador` y sus cuatro funciones (tipo, validar, renglones, pagos), la acción y el esquema de `src/lib/vender` | 1 |
| 2 | Ejecución | `tests/servicios/vender.base.test.ts`, `tests/rls/vender.base.test.ts`, `tests/servicios/caja-con-el-mostrador.base.test.ts` (23 en verde) y `e2e/vender.spec.ts` en computadora (12 en verde) | — |
| 3 | Números y bordes | SQL: total contra renglones y contra pagos en las 3812 ventas cerradas (0 diferencias); validación de pagos (cero, repetido, de más) leída contra la función | — |
| 4 | Criterios | «una venta», «el día» y el precio, anotados en el registro | — |
| 5 | Lógica por actor | caja vende sin ver lo vendido; admin entra desde Ventas; el tipo elegible | 2 |
| 6 | Reversa y propagación | `tests/verificacion/vender-anular.base.test.ts`: vender, medir 5 números, anular, medir (verde) | — → **cierra** |

# Arreglos de la revisión lógica de la primera fase: diseño

Pedido 34. Sale de la revisión lógica de cada módulo, hecha el 2026-10-12, y de lo que
Santiago aprobó.

Decisiones:

1. **Fondo inicial que no coincide.** `docs/modulos/06-cierres-de-caja.md` dice que el control
   marca el fondo que no coincide con lo que quedó en la caja el día anterior; no estaba
   construido. Bajar el fondo baja lo esperado y tapa un faltante. El control y el detalle del
   cierre lo marcan, sin tratarlo como diferencia.
2. **Retiros a la vista.** El control muestra, en cada cierre, el total retirado (opción A).
3. **El efectivo de la caja sale por el cierre.** Un gasto cargado a mano, o un recurrente,
   con "Efectivo de la caja" no llega nunca al cierre y deja un faltante. Ese medio deja de
   poder elegirse fuera de un cierre. Los que ya existen quedan como están y se pueden editar
   sin cambiarles el medio.
4. **Un gasto mandado dos veces no se duplica** (opción A), como las ventas: una clave por
   formulario abierto.
5. Sin decidir, con el cliente: a qué hora cierra el local. Si es después de medianoche, la
   fecha del cierre tiene que venir con el día anterior. No se toca hasta saberlo.
6. Al publicar: crear la cuenta del dueño en la base real antes de compartir la dirección.

## Base

Migración `revision_fase_1`:

- `gastos.clave uuid` con índice único `(local_id, clave)`.
- `reglas_de_gastos`: rechaza (`PG207`, "El efectivo de la caja sale por el cierre del dia")
  un gasto sin cierre con `efectivo_caja`, al cargarlo o al cambiarle el medio a ese. Lo que
  genera un recurrente o un cierre sigue entrando.
- `reglas_de_recurrentes`: rechaza (`PG207`) una plantilla con `efectivo_caja`, al crearla o
  al cambiarle el medio a ese.
- `cierres_fondos_anteriores(ids uuid[])` (`security invoker`, solo admin activo; `42501` si
  no): para cada cierre, lo que quedó en la caja en el cierre sin anular anterior de su local
  (`fondo_anterior_centavos`, nulo si no hay).

## Lógica pura

- `src/lib/caja/fondo.ts`: `diferenciaDeFondo(fondoInicial, fondoAnterior)` (nulo sin
  anterior) y `textoDeFondo(diferencia)` ("Arrancó con $5.000,00 menos de lo que quedó en el
  cierre anterior." / "más"); `totalDeRetiros(retiros)`.
- `src/lib/gastos/pantalla.ts`: `opcionesDeMedio(actual?)` deja afuera "Efectivo de la caja"
  salvo que sea el medio que ya tiene el gasto.
- `src/lib/gastos/esquemas.ts`: `clave` opcional (uuid) en el gasto.

## Pantallas

- Control de cierres: cada cierre muestra "Retiros: $X" si hubo, y la marca "Fondo distinto"
  si no coincide.
- Detalle del cierre: en "Efectivo de la caja", el texto de `textoDeFondo` si no coincide.
- Cargar gasto y plantilla recurrente: sin "Efectivo de la caja". El gasto nuevo lleva su
  clave; guardar dos veces devuelve el mismo gasto.

## Pruebas

- Puros: `fondo.ts`, `opcionesDeMedio`, el esquema con clave.
- Base: `PG207` al cargar y al editar un gasto y una plantilla; un gasto viejo con ese medio se
  edita sin cambiarlo; el gasto de un cierre sigue entrando; `cierres_fondos_anteriores` y su
  rechazo a caja; `crearGasto` dos veces con la misma clave da el mismo gasto.
- En vivo: el control marca el fondo distinto y los retiros de un cierre sembrado; cargar
  gasto no ofrece "Efectivo de la caja".

## Restricciones globales

- TDD estricto: test, verlo fallar, código. Sin mocks: contra la base de pruebas.
- 20 líneas por función en `.ts`, 80 por componente, 300 por archivo. Lógica fuera de `.tsx`.
- Español; pantallas con voseo. Plata en centavos enteros, `$1.234,50`.
- Nada se borra; toda escritura queda en la auditoría.
- Solo Santiago autoriza la base real, el merge y publicar.
- Hecho es `npm run verificar` y `npm run e2e` en verde.

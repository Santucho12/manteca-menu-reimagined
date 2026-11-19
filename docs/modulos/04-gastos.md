# Gastos

Módulo 12 de `PROPUESTA.md`. Quinto paso del orden de construcción.

Este archivo tiene dos partes. La definición funcional dice qué hace el módulo y se acordó
con Santiago el 2026-10-06. La parte técnica se escribe al construirlo.

## Para qué

Registrar todo lo que sale, para que el resultado del mes (ventas menos gastos) sea real.

## Quién lo usa

Solo Admin. Caja no entra a este módulo: anota en su cierre lo que pagó con la caja, y eso
llega acá como un gasto sin clasificar.

## Datos de un gasto

| Dato | Detalle |
|---|---|
| Fecha | Por defecto hoy; se puede cambiar. Define a qué mes cuenta |
| Categoría | Obligatoria |
| Monto | Obligatorio, mayor que cero |
| Descripción | Opcional |
| Proveedor | Solo en las categorías que lo piden (Mercadería arranca pidiéndolo), y ahí es obligatorio |
| Medio de pago | Efectivo de la caja (solo desde un cierre), efectivo fuera de la caja, transferencia, tarjeta, cheque u otro |
| Número de comprobante | Texto, opcional. No se adjuntan fotos |

## Categorías

Arrancan siete: Mercadería, Alquiler, Servicios, Sueldos, Impuestos, Mantenimiento y Otros.
El admin puede sumar, renombrar y desactivar categorías.

Mercadería es la compra de insumos y de productos de reventa. En esta fase se carga como
gasto (`docs/producto.md`).

Existe además **Sin clasificar**, que usa el sistema para los gastos que vienen de un
cierre. No se puede elegir a mano ni desactivar.

## Gastos fijos

Un gasto fijo (en la base, `gastos_recurrentes`) deja un pago por pagar cada vez que toca:
categoría, monto, descripción, proveedor, medio de pago, frecuencia y día. Hasta el 2026-10-27 se
llamaban "recurrentes" (Santiago no los entendía con ese nombre, pedido 58).

- Frecuencia: mensual, bimestral o anual.
- Se cargan desde "Cargar gasto", eligiendo cada cuánto se repite.
- El día que toca, el pago queda **por pagar**, con el monto del fijo, en Próximos pagos.
- **Cuenta en el resultado cuando se marca Pagado**, con la fecha en que se pagó (Santiago,
  2026-10-28, pedido 65). Hasta entonces nacía ya contado.
- Su pago queda marcado "Fijo · Todos los meses" en Pagados.
- Si ese mes el monto fue otro, se corrige al marcarlo pagado. Si no se paga, se quita con
  "No se paga", con motivo.
- Se puede marcar pagado antes de que venza, desde su próximo pago.

## Por pagar (pedido 65, 2026-10-28)

Lo que todavía no se pagó y se va a pagar en el corto plazo, como una factura que vence en unos
días, se anota con "¿Ya lo pagaste? Todavía no". Queda con su vencimiento, en Próximos pagos, y
**no cuenta en el resultado hasta que se paga**.

- **Pagado** abre una ventana con la fecha (hoy), el monto y el medio de pago ya completos: se
  confirma o se corrige. El gasto pasa a Pagados con la fecha del pago.
- **No se paga** lo quita, con motivo. Nada se borra.
- Si se anula el gasto de un pago, vuelve a Próximos pagos.
- Lo vencido queda arriba, en rosa.
- Se paga entero: no hay pagos parciales.

## Pantallas (pedido 58, 2026-10-27)

### Gastos (`/admin/gastos`)

Una sola pantalla con todo a la vista:

- **Para clasificar**, arriba, solo si hay: los gastos de caja sin categoría, de cualquier
  mes. Se les elige la categoría (y el proveedor, si la categoría lo pide) ahí mismo.
- **Pagados**: los gastos del mes, con flechas para cambiar de mes (no se pasa del de hoy),
  pastillas Todos, Fijos y De caja, y la categoría, que se aplica sola. Total de lo filtrado sin
  lo anulado, paginado de a 25. Cada fila: fecha, nombre, categoría, proveedor si tiene, medio,
  marcas (Fijo, De caja, Anulado) y monto.
- **Próximos pagos**: lo por pagar y el próximo pago de cada fijo activo, del más cercano al más
  lejano, con Pagado y (en lo ya anotado) No se paga, y lo que falta pagar este mes, con lo
  vencido. Los pausados, aparte (pedido 65).
- **Categorías**, en una ventana: sumar, renombrar, desactivar y reactivar, con "Pide
  proveedor".

En la computadora, Pagados a la izquierda y Próximos a la derecha; en el celular, Próximos
arriba.

### Cargar gasto y Gasto

Un solo formulario: "¿Se repite?", "¿Ya lo pagaste?" (si no se repite), la fecha con calendario
propio, categoría, proveedor (si la categoría lo pide), monto, descripción, medio y comprobante
(si no se repite). Un gasto pagado no puede tener fecha futura. Con "Todavía no", la fecha se
llama "Vence el", puede ser cualquiera y el medio es opcional (pedido 65).

### Gasto fijo (`/admin/gastos/fijos/[id]`)

Editar, "Próximo pago" con el calendario, pausar y reactivar, y los últimos seis pagos
("Pagos").

## Reglas

1. Un gasto no se borra: se anula, con motivo obligatorio. Lo anulado no cuenta en ningún
   total y sigue en el historial.
2. Un gasto se puede editar, y queda el valor anterior y el nuevo.
3. A un gasto que vino de un cierre no se le puede cambiar el monto ni el medio de pago:
   cambiaría la caja. Sí la categoría, el proveedor y la descripción.
4. Un gasto sin clasificar cuenta en el resultado desde que se crea.
5. Un fijo no se genera dos veces para el mismo período.
6. Un fijo pausado deja de generar. Los gastos que ya generó quedan.
7. Editar un fijo cambia los gastos futuros, no los ya generados. Si cambian el próximo pago o
   la frecuencia, cuenta desde el próximo pago, que tiene que ser después de hoy (`PG208`): no
   se vuelven a cargar meses pasados.
8. Si el día elegido no existe en un mes (el 31 en abril), se genera el último día del mes.
9. Una categoría desactivada no aparece para cargar gastos nuevos y conserva los que tiene.
10. El efectivo de la caja sale por el cierre del día: un gasto a mano o un recurrente no se
    carga con ese medio, porque nunca llegaría a la caja y la dejaría con un faltante. Un gasto
    que ya lo tenía se edita sin cambiárselo (Santiago, 2026-10-12).
11. La misma carga de un gasto o de un fijo mandada dos veces (un toque repetido, un reintento)
    no lo duplica: cada formulario lleva su clave.
12. El proveedor se pide solo en las categorías que lo piden. Un gasto viejo que ya tenía uno lo
    conserva mientras no le cambien la categoría (pedido 58).
13. Lo por pagar no cuenta en ningún total hasta que se paga; el pago cuenta en su fecha.
14. Lo por pagar tiene un solo pago vigente: pagarlo dos veces no lo duplica. Anulado el pago,
    vuelve a estar por pagar.
15. Lo pagado no se quita con "No se paga": se anula el pago. Lo quitado no se paga.
16. Un fijo deja un solo por pagar por vencimiento, aunque se haya quitado. Pagarlo antes de
    que venza vale solo para un vencimiento del fijo posterior a hoy.
17. Un gasto pagado con proveedor, si ya hay otro sin anular del mismo proveedor, monto y día,
    no se carga de una: avisa "Ya hay un gasto igual" y ofrece "Cargar igual" (pedido 86). El
    mismo formulario mandado dos veces no cuenta como repetido. Sin proveedor no avisa.
18. "Efectivo" se muestra "Efectivo (fuera de la caja)": plata que no salió de la caja del
    día (pedido 86).

## Casos de borde

- Un fijo con el monto desactualizado deja por pagar el monto viejo hasta que se edite; se
  corrige al marcarlo pagado.
- El proceso que genera los fijos no corrió un día: al día siguiente deja por pagar lo
  atrasado, con la fecha que correspondía.
- Se quita con "No se paga" el pago de un fijo: no se vuelve a generar para ese período.
- Los gastos que los fijos cargaron pagados antes del pedido 65 quedan como estaban y no se
  vuelven a generar.
- Se desactiva la categoría o el proveedor de algo por pagar: se paga igual.
- Se carga un gasto con fecha de un mes anterior: cuenta en ese mes y cambia su resultado.
- Doble clic en "Guardar": no crea dos gastos.
- Se anula el cierre del que vino un gasto: se define en el módulo de Cierres.

## Qué queda en la auditoría

- Cada alta, cambio y anulación de un gasto, con el valor anterior y el nuevo y el motivo.
- Cada alta, cambio y desactivación de una plantilla recurrente y de una categoría.
- Cada alta y anulación de lo por pagar; lo que deja un fijo figura como hecho por el sistema.

## Fuera de alcance

- Foto del comprobante.
- Pagos parciales, saldos pendientes y editar lo por pagar (se corrige al pagarlo).
- Recurrentes semanales o con otra frecuencia.
- Que Caja cargue o vea gastos.
- El módulo Compras: recepción, stock y costo de los insumos.

## Dónde se aparta de la propuesta

| Propuesta | Acá | Por qué |
|---|---|---|
| Las compras de materia prima no son gastos | Se cargan como gasto, en Mercadería | Sin el módulo Compras no quedarían registradas |
| Recurrentes mensuales | Mensuales, bimestrales y anuales | Decisión de Santiago |
| Pagos y vencimientos en el flujo de fondos | Lo por pagar con su vencimiento, sin pagos parciales | Decisión de Santiago (2026-10-28, pedido 65) |

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Categorías | Lista inicial que el admin puede cambiar |
| Proveedor | Solo en las categorías que lo piden (Santiago, 2026-10-27) |
| Nombre de los recurrentes | Gastos fijos (Santiago, 2026-10-27) |
| Pantalla | Una sola: Para clasificar, Pagados por mes y Próximos pagos; categorías en una ventana (Santiago, 2026-10-27) |
| Comprobante | Solo el número; sin adjuntos |
| Cómo nacen los fijos | Por pagar el día que vencen; cuentan al marcarlos pagados (Santiago, 2026-10-28; antes, ya contados) |
| Por pagar | Se anota con "¿Ya lo pagaste? Todavía no", se ve en Próximos pagos y cuenta al pagarse, en la fecha del pago (Santiago, 2026-10-28) |
| Marcar pagado | Una ventana con fecha, monto y medio ya completos, para confirmar o corregir (Santiago, 2026-10-28) |
| Frecuencia | Mensual, bimestral y anual |
| Gastos pagados con la caja | Caja los anota en el cierre; el admin los clasifica |
| Corregir un gasto | Se edita, con auditoría |

## Parte técnica

Construido el 2026-10-08 (pedido 27). El detalle está en
`docs/superpowers/specs/2026-10-08-gastos-design.md`.

- **Base:** tablas `categorias_de_gasto`, `gastos_recurrentes` y `gastos`. El admin activo
  lee, carga y cambia lo de su local con RLS; el local y el autor los pone la base y nadie
  borra. Las reglas están en triggers, con códigos `PG201` a `PG206`: categoría disponible,
  Mercadería pide proveedor, proveedor activo (un gasto viejo conserva el suyo), anulado
  cerrado, motivo obligatorio y "Sin clasificar" fija. Cada local arranca con las 7
  categorías y "Sin clasificar".
- **Recurrentes:** `generar_gastos_recurrentes(hasta)` crea cada vencimiento que falte desde
  el primero (el 31 de enero pasa al 28 de febrero y vuelve al 31 en marzo). La corre pg_cron
  todos los días a las 3 de Argentina y el servidor al abrir Gastos, con la clave secreta y
  solo si abre un admin. Lo generado queda a nombre del sistema y se marca "Automático" en
  la lista. Un recurrente reactivado genera desde ese día: lo vencido mientras estuvo
  desactivado no aparece.
- **Totales:** `gastos_total` y `gastos_pagado_por_proveedor` suman sin anulados, con RLS.
- **Montos:** se escriben con coma para los centavos y punto de miles opcional (12.345,50);
  se rechazan el punto decimal, más de dos decimales y el cero.
- **Pantallas:** `/admin/gastos` (filtros por fechas, categoría y proveedor; el mes en curso
  por defecto; total; paginado de a 25), carga, edición y anulación, `/admin/gastos/recurrentes`
  y `/admin/gastos/categorias`.

Con el módulo de Cierres (pedido 28) llegan los gastos pagados con la caja: entran en "Sin
clasificar", marcados "De caja", y la regla 3 quedó en la base (`PC305` y `PC306`).

Pedido 58 (2026-10-27): la pantalla se rehízo (diseño en
`docs/superpowers/specs/2026-10-27-gastos-desde-cero-design.md`). En la base,
`gastos_recurrentes.clave`, `PG208` en `reglas_de_recurrentes()` y `gastos_total` con `el_tipo`
(migración `20261027210000_gastos_fijos`). Se fueron `/admin/gastos/recurrentes` y
`/admin/gastos/categorias`; llegó `/admin/gastos/fijos/[id]`.

Pedido 65 (2026-10-28): lo por pagar (diseño en
`docs/superpowers/specs/2026-10-28-gastos-por-pagar-design.md`).

- **Base:** tabla `gastos_por_pagar` y `gastos.por_pagar_id`, con un índice único sin los
  anulados. Pagar es cargar un gasto con `por_pagar_id`: un trigger copia los datos de lo por
  pagar.
- **Códigos:** `PG209` (ya no está por pagar), `PG210` (lo pagado no se quita) y `PG211` (no es
  un próximo pago del fijo).
- **Fijos:** `generar_gastos_recurrentes` deja por pagar lo que vence, sin duplicar lo que ya
  estaba cargado pagado.
- **Lectura:** `pagos_pendientes()` lista lo vigente, con RLS.
- **Migración:** `20261028150000_gastos_por_pagar`.

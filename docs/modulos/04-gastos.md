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
| Medio de pago | Efectivo de la caja, transferencia, tarjeta u otro |
| Número de comprobante | Texto, opcional. No se adjuntan fotos |

## Categorías

Arrancan siete: Mercadería, Alquiler, Servicios, Sueldos, Impuestos, Mantenimiento y Otros.
El admin puede sumar, renombrar y desactivar categorías.

Mercadería es la compra de insumos y de productos de reventa. En esta fase se carga como
gasto (`docs/producto.md`).

Existe además **Sin clasificar**, que usa el sistema para los gastos que vienen de un
cierre. No se puede elegir a mano ni desactivar.

## Gastos fijos

Un gasto fijo (en la base, `gastos_recurrentes`) se carga solo cada vez que toca: categoría,
monto, descripción, proveedor, medio de pago, frecuencia y día. Hasta el 2026-10-27 se llamaban
"recurrentes" (Santiago no los entendía con ese nombre, pedido 58).

- Frecuencia: mensual, bimestral o anual.
- Se cargan desde "Cargar gasto", eligiendo cada cuánto se repite.
- El día que toca, el sistema crea el gasto solo, con el monto del fijo.
- **El gasto nace ya contado** en el resultado del mes, sin esperar confirmación.
- En la lista queda marcado "Fijo · Todos los meses", para que se lo pueda revisar.
- Si ese mes el monto fue otro, el admin lo edita. Si no se pagó, lo anula.

## Pantallas (pedido 58, 2026-10-27)

### Gastos (`/admin/gastos`)

Una sola pantalla con todo a la vista:

- **Para clasificar**, arriba, solo si hay: los gastos de caja sin categoría, de cualquier
  mes. Se les elige la categoría (y el proveedor, si la categoría lo pide) ahí mismo.
- **Pagados**: los gastos del mes, con flechas para cambiar de mes (no se pasa del de hoy),
  pastillas Todos, Fijos y De caja, y la categoría, que se aplica sola. Total de lo filtrado sin
  lo anulado, paginado de a 25. Cada fila: fecha, nombre, categoría, proveedor si tiene, medio,
  marcas (Fijo, De caja, Anulado) y monto.
- **Próximos pagos**: cada fijo activo con su próximo pago, del más cercano al más lejano, y
  lo que falta pagar este mes. Los pausados, aparte.
- **Categorías**, en una ventana: sumar, renombrar, desactivar y reactivar, con "Pide
  proveedor".

En la computadora, Pagados a la izquierda y Próximos a la derecha; en el celular, Próximos
arriba.

### Cargar gasto y Gasto

Un solo formulario: fecha con calendario propio y atajos Hoy y Ayer, "¿Se repite?", categoría,
proveedor (si la categoría lo pide), monto, descripción, medio y comprobante (si no se repite).
Un gasto que no se repite no puede tener fecha futura.

### Gasto fijo (`/admin/gastos/fijos/[id]`)

Editar, "Próximo pago" con el calendario, pausar y reactivar, y los últimos seis pagos que
cargó.

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

## Casos de borde

- Un recurrente con el monto desactualizado sigue generando el monto viejo hasta que se
  edite la plantilla. Es la consecuencia de que nazcan ya contados: el resultado del mes
  puede estar mal sin que nadie lo note. La marca "generado automáticamente" es el resguardo.
- El proceso que genera los recurrentes no corrió un día: al día siguiente genera lo
  atrasado, con la fecha que correspondía.
- Se anula un gasto generado por un recurrente: no se vuelve a generar para ese período.
- Se carga un gasto con fecha de un mes anterior: cuenta en ese mes y cambia su resultado.
- Doble clic en "Guardar": no crea dos gastos.
- Se anula el cierre del que vino un gasto: se define en el módulo de Cierres.

## Qué queda en la auditoría

- Cada alta, cambio y anulación de un gasto, con el valor anterior y el nuevo y el motivo.
- Cada alta, cambio y desactivación de una plantilla recurrente y de una categoría.
- Los gastos generados automáticamente figuran como hechos por el sistema.

## Fuera de alcance

- Foto del comprobante.
- Cuentas a pagar: vencimientos, pagos parciales y saldos pendientes.
- Recurrentes semanales o con otra frecuencia.
- Que Caja cargue o vea gastos.
- El módulo Compras: recepción, stock y costo de los insumos.

## Dónde se aparta de la propuesta

| Propuesta | Acá | Por qué |
|---|---|---|
| Las compras de materia prima no son gastos | Se cargan como gasto, en Mercadería | Sin el módulo Compras no quedarían registradas |
| Recurrentes mensuales | Mensuales, bimestrales y anuales | Decisión de Santiago |
| Pagos y vencimientos en el flujo de fondos | No hay vencimientos | Cuentas a pagar queda afuera |

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Categorías | Lista inicial que el admin puede cambiar |
| Proveedor | Solo en las categorías que lo piden (Santiago, 2026-10-27) |
| Nombre de los recurrentes | Gastos fijos (Santiago, 2026-10-27) |
| Pantalla | Una sola: Para clasificar, Pagados por mes y Próximos pagos; categorías en una ventana (Santiago, 2026-10-27) |
| Comprobante | Solo el número; sin adjuntos |
| Cómo nacen los recurrentes | Ya contados, sin confirmación |
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

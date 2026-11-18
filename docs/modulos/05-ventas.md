# Ventas

Módulo 10 de `PROPUESTA.md`. Sexto paso del orden de construcción.

Este archivo tiene dos partes. La definición funcional dice qué hace el módulo: se acordó con
Santiago el 2026-10-06 y se rehízo el 2026-11-18, cuando Manteca dejó Fudo (pedido 89). La
parte técnica se escribe al construirlo.

## Para qué

Tener en el sistema todo lo que se vendió, cargado en el momento de cobrar, para saber cuánto
entró y calcular lo que debería haber en la caja.

## Quién lo usa

| Quién | Qué hace acá |
|---|---|
| Caja | Vende en el mostrador. No ve las ventas ni lo vendido en el día, y no anula |
| Admin | Vende en el mostrador, carga ventas a mano, ve todas y las anula |

## De dónde salen las ventas

| Origen | Quién y cuándo |
|---|---|
| Mostrador | Caja o el admin, en el momento de cobrar, desde Vender |
| A mano | El admin: lo que no se cobró en el mostrador (encargos, ventas a comercios, Cheaf) o lo que se vendió sin conexión |

Manteca dejó Fudo y registra sus ventas acá (Santiago, 2026-11-18). El sistema no factura: la
facturación sigue fuera del sistema, como antes.

## Vender en el mostrador

Pantalla `/admin/vender`, pensada para una pantalla táctil de computadora o tablet. También anda
en el celular.

- **Productos.** Arriba, las categorías del menú en su orden; abajo, sus productos activos como
  botones grandes, se muestren o no en la carta (el agua se vende aunque no esté en la carta).
  Un producto con una sola forma de venta se suma de un toque; con varias (Docena, Media docena,
  Unidad), el toque muestra cada una con su precio.
- **Ticket.** Cada renglón con el producto, la forma de venta, la cantidad (con − y +) y el
  subtotal, y el total abajo. Se puede sacar un renglón o vaciar el ticket.
- **Cobrar.** Se elige el medio: efectivo, débito, crédito, QR o transferencia. "Pagar con dos
  medios" suma un segundo medio: se escribe cuánto va con el primero y el resto va con el
  segundo. Con efectivo se puede escribir con cuánto paga el cliente, y la pantalla muestra el
  vuelto.
- **Al guardar,** avisa "Venta guardada" con el total (y el vuelto, si hay) y deja el ticket
  vacío para la próxima.
- **Sin conexión,** avisa que no se pudo guardar y el ticket queda como estaba, para volver a
  probar. Si no vuelve, se anota en papel y el admin la carga a mano después, con su fecha.

### Reglas del mostrador

1. El precio es el del menú y lo calcula el servidor. En el mostrador no se cambia ni se hacen
   descuentos.
2. Si un precio cambió con el ticket armado, no se cobra: la pantalla avisa cuál cambió y trae
   los precios nuevos.
3. Se paga con uno o dos medios distintos, cada uno mayor que cero, que suman el total.
4. La fecha es hoy en Argentina y no se elige.
5. El tipo de venta es Local. Lo que se vende en el mostrador se cobra siempre en la caja del
   local.
6. Un doble toque en Cobrar guarda una sola venta.
7. Caja no ve lo vendido en el día, ni en total ni por medio: si lo viera, dejaría de contar a
   ciegas al cerrar la caja (ver `06-cierres-de-caja.md`).
8. Caja no anula. Si se equivocó, le avisa al admin, que anula la venta con motivo.
9. Se vende solo un producto activo con precio en esa forma de venta.

## Ventas cargadas a mano

| Dato | Detalle |
|---|---|
| Fecha | Por defecto hoy; no acepta un día futuro |
| Producto | Del catálogo del sistema |
| Cantidad | Mayor que cero |
| Precio | Trae el del menú y se puede cambiar |
| Medio de pago | Efectivo, débito, crédito, QR o transferencia |
| Tipo de venta (en el código, canal) | Cheaf, Encargo, Venta a comercios u Otro. El admin puede cambiar la lista |
| Se cobró en la caja del local | Casilla, sin marcar. Marcada, la venta suma a lo esperado del cierre de ese día |

- Suma a los reportes y al resultado como cualquier venta.
- Se anula con motivo obligatorio. No se edita: se anula y se carga de nuevo.

## Pantallas

### Vender (`/admin/vender`)

La de "Vender en el mostrador". Para Caja es la primera de su menú.

### Ventas (`/admin/ventas`), solo admin

- Lista de ventas con fecha, origen (Mostrador o A mano), quién la cargó, total, medios de pago
  y estado.
- Filtros por fechas, origen, medio de pago y estado. La lista está paginada.
- Total de lo filtrado.
- Al abrir una venta se ven sus productos y sus pagos, y se anula con motivo.

### Cargar una venta a mano (`/admin/ventas/nueva`), solo admin

- El formulario de la tabla de arriba.

## Reglas

1. "El día" de una venta es el día calendario en Argentina en que se cobró.
2. Lo anulado no cuenta en ningún total y sigue visible.
3. Una venta no se edita: se anula con motivo y se carga de nuevo.
4. Lo esperado de la caja suma solo lo cobrado en la caja del local: todo lo del mostrador y lo
   cargado a mano con la casilla marcada.
5. Si cambian las ventas de un día (se carga o se anula una), el resultado del cierre de ese día
   cambia solo: se calcula al mostrar.

## Casos de borde

- Se vende después de cargado el cierre del día: el resultado del cierre cambia y puede quedar
  con diferencia.
- Se desactiva un producto con el ticket armado: no se cobra, la pantalla avisa cuál y se saca
  del ticket.
- Un empleado desactivado con ventas: siguen a su nombre.
- Se cae la conexión justo al cobrar y la venta sí se guardó: el reintento no la duplica.

## Qué queda en la auditoría

- Cada venta, del mostrador o a mano: quién, cuándo y todo lo cargado.
- Cada anulación, con quién, cuándo y el motivo.

## Fuera de alcance

- Facturar o emitir comprobantes.
- Descuentos o cambiar el precio en el mostrador.
- Mesas y pedidos abiertos.
- Imprimir.
- Vender sin conexión.
- Descontar stock.
- Costo y ganancia de cada venta.

## Lo que quedó de Fudo

Hasta el 2026-11-18 las ventas iban a entrar de Fudo, por su API, y mientras tanto se subía su
Excel "Reporte-Ventas" (pedidos 59 y 84). Desde el pedido 89 se arranca de cero, sin traer el
historial: se sacan la subida del Excel, "Ventas de Fudo cargadas hasta", la fila "Sin detalle de
productos (Excel de Fudo)" de los reportes y la espera de los cierres. Las ventas de Fudo que ya
estén en la base quedan como están, con origen Fudo: nada se borra.

## Dónde se aparta de la propuesta

| Propuesta | Acá | Por qué |
|---|---|---|
| Las ventas se importan de Fudo | Se registran en el sistema, en el mostrador | Manteca dejó Fudo (Santiago, 2026-11-18) |
| Reemplazar Fudo, a futuro | Entra ahora, solo para registrar ventas en el mostrador | Decisión de Santiago, 2026-11-18 |
| Cada venta descuenta stock | No | Stock es de la segunda fase |

Falta reflejarlo en `PROPUESTA.md`, con el texto que defina Santiago.

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Dónde se registran las ventas | En el sistema, en el momento de cobrar (Santiago, 2026-11-18) |
| Mesas | No: solo mostrador |
| Historial de Fudo | No se trae: se arranca de cero |
| Pantalla del mostrador | Táctil, de computadora o tablet |
| Medios por venta | Uno o dos |
| Precio en el mostrador | El del menú, sin cambios ni descuentos |
| Quién anula | Solo el admin, con motivo |
| Facturación | Fuera del sistema |
| Tipos de venta a mano (antes «canales»: Santiago cambió la palabra el 2026-10-28) | Lista inicial que el admin puede cambiar |
| Precio de venta a mano | Trae el del menú y se puede cambiar |

## Parte técnica

Primera parte construida el 2026-10-11 (pedido 30). El detalle está en
`docs/superpowers/specs/2026-10-10-ventas-design.md`.

- **Base:** tablas `ventas` (origen a mano o Fudo, identificador de Fudo único por local,
  estado, total), `renglones_de_venta`, `pagos_de_venta` (uno de los cinco medios del cierre)
  y `canales_de_venta` (Cheaf, Encargo, Venta a comercios y Otro). Solo el admin activo de
  su local las ve; nadie inserta directo ni borra.
- **Venta a mano:** `ventas_guardar_manual` calcula cada subtotal (cantidad por precio,
  redondeado a centavos) y el total, y guarda venta, renglones y pago juntos. Rechaza un día
  futuro (`PV301`), una venta sin productos (`PV302`) y un tipo de venta o producto que ya no está
  disponible (`PV303`, `PV304`). Se anula con motivo (`PV306`) y no se cambia después
  (`PV305`); una de Fudo no se anula (`PV307`).
- **Totales:** `ventas_totales` suma lo cobrado y, aparte, lo cancelado, sin lo anulado; con
  un medio, solo lo pagado con él.
- **Pantallas:** `/admin/ventas` (filtros, totales, paginada), `/admin/ventas/nueva` (varios
  productos, el precio del menú editable, el total mientras se escribe), `/admin/ventas/[id]` y
  `/admin/ventas/canales`.

Lo del mostrador (pedido 89) se agrega acá al construirlo.

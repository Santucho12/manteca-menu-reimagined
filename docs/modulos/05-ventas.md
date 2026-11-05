# Ventas

Módulo 10 de `PROPUESTA.md`. Sexto paso del orden de construcción.

Este archivo tiene dos partes. La definición funcional dice qué hace el módulo y se acordó
con Santiago el 2026-10-06. La parte técnica se escribe al construirlo.

## Para qué

Tener en el sistema todo lo que se vendió, sin que nadie lo cargue, para saber cuánto entró
y calcular lo que debería haber en la caja.

## Quién lo usa

Solo Admin. Caja no entra a este módulo.

## De dónde salen las ventas

| Origen | Cómo entran |
|---|---|
| Fudo | Solas, por la API de Fudo |
| Fuera de Fudo (Cheaf, encargos, ventas a comercios) | Las carga el admin a mano |

El sistema no cobra ni reemplaza a Fudo.

## Ventas de Fudo

### Sincronización

- Una vez por noche el sistema trae las ventas del día.
- El admin tiene el botón "Actualizar ahora" para traer lo que falte en el momento.
- Al guardarse un cierre de caja, el sistema trae las ventas de ese día en ese momento, para
  poder calcular la diferencia.
- Traer dos veces la misma venta no la duplica: se reconoce por su identificador de Fudo.
- Si una venta cambió en Fudo después de traída (se canceló, se corrigió un pago), la
  próxima sincronización la actualiza.
- La primera vez se traen los últimos 12 meses.
- Si Fudo no responde, el sistema reintenta en la próxima corrida y avisa en Inicio desde
  cuándo no entran ventas.

### Qué se guarda de cada venta

Fecha y hora, total, estado, los productos vendidos con cantidad y precio, y los pagos con
su medio y su monto.

### Estados

| Estado en Fudo | Qué hace el sistema |
|---|---|
| Cerrada | Cuenta |
| Cancelada | No cuenta. Se muestra cuánto se canceló y cuántas veces |
| En curso | No cuenta hasta que se cierre |

### Vinculación de productos

- El sistema trae la lista de productos de Fudo.
- El admin asocia cada producto de Fudo a un producto del sistema, una sola vez.
- Varios productos de Fudo pueden apuntar al mismo producto del sistema.
- **Las ventas de un producto sin vincular entran igual** y cuentan en la plata. En los
  reportes por producto figuran como "sin vincular" hasta que se asocien.
- Vincular un producto actualiza también las ventas anteriores.

### Ventas sin medio de pago

Si los pagos de una venta suman menos que su total, la parte sin pago se muestra aparte como
"sin medio de pago". No suma a lo esperado de ningún medio.

## Ventas cargadas a mano

| Dato | Detalle |
|---|---|
| Fecha | Por defecto hoy |
| Producto | Del catálogo del sistema |
| Cantidad | Mayor que cero |
| Precio | Trae el del menú y se puede cambiar |
| Medio de pago | Los mismos que usa Fudo |
| Tipo de venta (en el código, canal) | Cheaf, Encargo, Venta a comercios u Otro. El admin puede cambiar la lista |

- Tiene el mismo efecto que una venta de Fudo: suma a los reportes y al resultado.
- Si se cobró con efectivo de la caja, suma a lo esperado de la caja de ese día.
- Se anula con motivo obligatorio. No se edita el monto: se anula y se carga de nuevo.

## Pantallas

### Ventas (`/admin/ventas`)

- Lista de ventas con fecha, origen, total, medios de pago y estado.
- Filtros por fechas, origen, medio de pago y estado. La lista está paginada.
- Total de lo filtrado, con las canceladas aparte.
- Cuándo fue la última sincronización, y el botón "Actualizar ahora".
- Al abrir una venta se ven sus productos y sus pagos.

### Vinculación

- Arriba, los productos de Fudo sin vincular, con cuánto se vendió de cada uno.
- Abajo, los ya vinculados, con la opción de cambiar la asociación.

### Cargar una venta a mano

- El formulario de la tabla de arriba.

## Reglas

1. Una venta de Fudo no se edita ni se anula desde el sistema: se corrige en Fudo y la
   sincronización trae el cambio.
2. "El día" de una venta es el día calendario en Argentina en que se cerró.
3. Lo cancelado y lo anulado no cuentan en ningún total y siguen visibles.
4. Si una venta ya traída cambia, el resultado del cierre de ese día cambia solo: se
   calcula al mostrar.
5. Los precios de una venta de Fudo son los de Fudo, no los del menú del sistema.
6. El sistema solo lee de Fudo. No escribe nada.

## Casos de borde

- Un producto nuevo en Fudo aparece vendido antes de estar vinculado: la venta cuenta y el
  producto queda en la lista de pendientes.
- Un producto se borra o se renombra en Fudo: las ventas viejas conservan su vinculación.
- "Actualizar ahora" tocado dos veces seguidas: la segunda no hace nada hasta que termine la
  primera.
- Fudo corta por límite de pedidos en la carga de los 12 meses: la carga sigue desde donde
  quedó en la próxima corrida.
- Una venta se cierra en Fudo después de guardado el cierre de caja de ese día: el cierre se
  recalcula y queda marcado con "hubo ventas después del cierre".

## Qué queda en la auditoría

- Cada venta a mano: alta y anulación, con el motivo.
- Cada vinculación y cada cambio de vinculación.
- Cada sincronización: cuándo corrió, cuántas ventas trajo y si falló. Figura como hecha por
  el sistema, o por el admin si usó el botón.

## Fuera de alcance

- Cobrar, facturar o modificar algo en Fudo.
- Descontar stock.
- Costo y ganancia de cada venta.

## Dónde se aparta de la propuesta

| Propuesta | Acá | Por qué |
|---|---|---|
| Se sube el Excel de Fudo | Las ventas entran por la API; hasta tener las credenciales, se sube el "Reporte-Ventas" (pedido 59) | El Excel trae totales por día, sin productos. El cliente pasa al plan Pro |
| Control de duplicados y anular una importación | No existen | Cada venta se reconoce por su identificador y se actualiza sola |
| Cada venta descuenta stock | No | Stock es de la segunda fase |

Falta reflejarlo en `PROPUESTA.md`, con el texto que defina Santiago.

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Fuente | La API de Fudo |
| Frecuencia | Una vez por noche, más "Actualizar ahora" |
| Historia inicial | Últimos 12 meses |
| Productos sin vincular | Las ventas entran igual |
| Canceladas | No cuentan, pero se muestran |
| Tipos de venta a mano (antes «canales»: Santiago cambió la palabra el 2026-10-28) | Lista inicial que el admin puede cambiar |
| Precio de venta a mano | Trae el del menú y se puede cambiar |

## Sin confirmar

| Qué | Cómo se confirma |
|---|---|
| Que la API funcione y traiga lo que dice su documentación | Probándola con las credenciales reales el primer día del plan Pro, contra los totales diarios del Excel del 5/9 al 5/10 de 2026 |
| Límite de pedidos, historia disponible y estabilidad de la versión `v1alpha1` | Consulta enviada a Fudo el 2026-10-06 |

Ventas no se construye hasta que la primera fila esté confirmada.

## Parte técnica

Primera parte construida el 2026-10-11 (pedido 30), sin las credenciales de Fudo, por
excepción de Santiago a la regla de "Sin confirmar". El detalle está en
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

Queda para cuando estén las credenciales de Fudo: traer las ventas (la noche, "Actualizar
ahora" y al guardar un cierre), vincular productos y medios de pago de Fudo, y calcular lo
esperado en los cierres. Desde el pedido 66 el resultado del cierre se calcula al mostrar con las ventas del día.

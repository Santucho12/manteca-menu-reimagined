# Compras

Módulo 5 de `PROPUESTA.md`, sin stock. Santiago lo suma junto con Materia prima y Costos el
2026-11-19 (pedido 96), como excepción a "lo de la segunda fase no se construye por
adelantado". Lo que sigue lo definió Claude con su OK ("lo que creas mejor").

Este archivo tiene dos partes. La definición funcional dice qué hace el módulo. La parte
técnica está en `docs/superpowers/specs/2026-11-19-costos-y-compras-design.md`.

## Para qué

Registrar la mercadería que entra con lo que realmente llegó y a qué precio, para que los
costos se actualicen solos y lo pagado o lo debido a cada proveedor quede a la vista.

## Quién lo usa

Solo Admin. Caja sigue anotando en su cierre lo que pagó con la caja (ver "Pagada con la
caja").

## El recorrido

1. **Pedido** (opcional): se arma con el proveedor, los insumos y las cantidades, con el
   último precio de cada uno. "Mandar por WhatsApp" abre el chat del proveedor con el pedido
   escrito. Queda "Pedida".
2. **Recepción:** se carga lo que llegó de verdad, cantidad y precio de cada renglón,
   partiendo del pedido o de cero. Si pediste harina, azúcar y levadura y no vino la
   levadura, se recibe sin ella. Lo que no llegó no queda pendiente: se pide de nuevo.
3. **Factura y pago:** el número de factura, opcional; si se pagó, con qué y cuándo, o si
   queda por pagar, con su vencimiento.

Una compra se puede cargar directo recibida, sin pedido, que es lo más común.

## Datos de una compra recibida

| Dato | Detalle |
|---|---|
| Proveedor | Obligatorio |
| Fecha | El día que llegó. Por defecto hoy, no futura |
| Renglones | Forma de compra (insumo, cómo se compra y contenido), cantidad y precio unitario pagado |
| Otros cargos | Flete, percepciones, redondeos: un monto que suma al total y no al costo de los insumos |
| Total | Suma de los renglones más los otros cargos. Lo calcula el sistema |
| Factura | Número, opcional |
| Pago | Pagada (medio y fecha) o por pagar (vencimiento) |

El precio que se carga es **el que se pagó**, con impuestos incluidos. Es un supuesto: si
Manteca es responsable inscripto, el contador puede pedir que el costo vaya sin IVA, y se
ajusta cuando se sepa.

## La compra y los gastos

Una compra no se carga también como gasto: **la compra genera su gasto**, en la categoría
Mercadería, con el proveedor y el total, marcado "Compra" y con enlace a ella.

- Pagada: genera un gasto pagado, que cuenta en el resultado el día del pago.
- Por pagar: genera un por pagar en Gastos, que se paga desde Próximos pagos como cualquier
  otro y cuenta el día que se paga.

Así el resultado del mes, lo pagado y lo por pagar de cada proveedor y los Próximos pagos
siguen saliendo de un solo lugar. La compra cuenta en el resultado el día que se paga, igual
que hoy la mercadería; no se resta "a medida que se venden los productos": eso necesita
stock.

Se puede seguir cargando un gasto de Mercadería a mano, para lo que no vale la pena detallar.
Ese gasto cuenta en el resultado, pero no cambia ningún precio, y el formulario lo dice.

## Pagada con la caja

Caja no carga compras: anota en su cierre lo que pagó, y eso llega a Gastos como "Sin
clasificar". Ahí el admin elige **"Es una compra"** y carga los renglones. La compra queda
unida a ese gasto, sin generar otro: el monto y el medio son los del cierre. Si los renglones
no llegan al monto, la diferencia va a otros cargos; si lo pasan, no se puede guardar.

## Pantallas

### Compras (`/admin/compras`)

- Lista del mes con fecha, proveedor, cantidad de renglones, total, estado (Pedida,
  Recibida, Anulada) y pago (Pagada o Por pagar, con el vencimiento).
- Filtro por proveedor y estado. Los pedidos sin recibir, arriba.
- Botones "Cargar compra" (recibida) y "Armar pedido".

### Compra

El detalle con sus renglones, el gasto o el por pagar que generó y las acciones: recibir (un
pedido), mandar por WhatsApp (un pedido), anular.

### En otras pantallas

- **Proveedores:** la ficha suma sus compras y lo que se le compra (sus formas de compra).
- **Materia prima:** la ficha del insumo muestra el último precio pagado a cada proveedor.
- **Gastos:** "Es una compra" en Para clasificar, y el gasto de una compra lleva a ella.

## Reglas

1. Nada se borra: una compra se anula, con motivo.
2. Anular una compra recibida anula su gasto o su por pagar, y los insumos vuelven al precio
   de la compra anterior. Si ya se pagó un por pagar, primero se anula el pago, en Gastos.
3. Anular una compra que vino de un gasto de caja no anula ese gasto, porque la plata salió
   de la caja: vuelve a Para clasificar.
4. Un pedido sin recibir se anula sin tocar nada más.
5. Una compra recibida no se edita: se anula y se carga de nuevo. Así el precio de los
   insumos nunca cambia por debajo.
6. El precio unitario de cada renglón es mayor que cero, salvo una bonificación (un renglón a
   $0, que no cambia el precio del insumo).
7. La misma carga mandada dos veces no la duplica.
8. Cada alta, recepción y anulación queda en la auditoría.

## Fuera de alcance

Stock y su recepción, pagos parciales o a cuenta, pagar varias facturas con un solo pago,
adjuntar la foto de la factura, y el costo de lo vendido calculado con stock.

## Parte técnica (pedido 96)

- Base: `supabase/migrations/20261119160000_compras.sql`. Tablas `compras` y
  `renglones_de_compra`, que se leen solo como admin activo de su local y se escriben solo con
  funciones: `compras_recibir` (compra directa o recepción de un pedido, con su gasto pagado o
  su por pagar), `compras_pedir`, `compras_desde_gasto` (sobre un gasto de caja "Sin
  clasificar") y `compras_anular`. Errores `PU300` a `PU312`. La clave de carga hace que el
  doble envío no duplique.
- `gastos.compra_id` y `gastos_por_pagar.compra_id` llevan a la compra. `reglas_de_gastos`
  suma una salida (`manteca.desde_compras`) para devolver un gasto de caja a "Sin clasificar"
  al anular su compra.
- `costo_de_insumos()` toma el último renglón con precio de una compra recibida y no anulada
  (por fecha de la compra y después por carga) y, si no hay, la referencia.
- Servidor en `src/lib/compras/`; pantallas en `src/app/admin/(panel)/compras/` (lista,
  `nueva`, `pedido`, `[id]`, `desde-gasto/[gasto]`). Suma a Gastos el enlace "Es una compra"
  y el aviso de la Mercadería a mano; a Proveedores, sus compras; a Materia prima, el último
  precio pagado de cada forma de compra.

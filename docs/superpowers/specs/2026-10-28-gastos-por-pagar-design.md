# Gastos por pagar (pedido 65)

## Por qué

Santiago, 2026-10-28: "En gastos deberíamos poder anotar cosas que ya pagamos o cosas que van a
estar por pagar, que se pagarán en el corto plazo" y "esos gastos deberías poder anotarlos como
que ya los pagué o como que todavía no los pagué". Hoy Gastos solo anota lo pagado y los fijos
nacen pagados el día que vencen, aunque se paguen después.

## Decisiones de Santiago (2026-10-28)

1. **(1a)** Lo por pagar no cuenta en el resultado del mes hasta que se marca pagado; cuenta en la
   fecha en que se pagó. Pagados sigue siendo lo que salió.
2. **(2a)** Lo por pagar se ve en **Próximos pagos**, junto a los fijos, con su fecha y un botón
   **Pagado**. Lo vencido queda arriba, marcado **Vencido**.
3. **(3b)** Los fijos dejan de pasar solos a Pagados: el día que vencen quedan por pagar y se
   marcan con Pagado. Cambia la decisión del 2026-10-06 ("nacen ya contados").
4. **(4a)** Pagado abre una ventana con la fecha (hoy), el monto y el medio de pago ya
   completos: se confirma o se corrige.
5. Pagar en partes queda afuera: lo por pagar se paga entero.
6. Rama: sigue en `feat/caja-control-detalle`, la de otra sesión. Es una excepción de Santiago,
   anotada en `PEDIDOS.md`, como en el pedido 58.

## Decisiones mías, para que Santiago las revise

- **Cargar gasto pregunta "¿Ya lo pagaste? Sí / Todavía no" solo si no se repite.** Un fijo
  siempre deja cada pago por pagar en su fecha. Si al crearlo la fecha ya pasó, ese pago
  aparece vencido y se marca con Pagado, eligiendo en la ventana el día en que se pagó.
- **Con "Todavía no"**, la fecha pasa a llamarse "Vence el" y puede ser pasada o futura. El
  medio de pago es opcional: se elige al pagar.
- **Un fijo se puede marcar pagado antes de que venza**: su próximo pago también tiene el
  botón Pagado (el alquiler que vence el 5 y se paga el 3).
- **No se paga**: lo por pagar se anula con motivo y deja de figurar; nada se borra. El pago de
  un fijo anulado así no se vuelve a generar.
- **Si se anula el gasto de un pago, vuelve a Próximos pagos** como por pagar.
- **Lo por pagar no se edita**: se corrige al pagarlo (fecha, monto, medio) o se anula y se carga
  de nuevo.
- **"Falta pagar este mes"** suma lo por pagar que vence hasta fin de mes, incluidos los
  vencidos, y los próximos pagos de los fijos que caen este mes.
- **Inicio no cambia**: sigue avisando los fijos que vencen esta semana. El aviso de vencidos
  queda para después.

## Cómo funciona

### Base

- **Tabla `gastos_por_pagar`**: local, vencimiento, categoría, proveedor, descripción, monto,
  medio de pago (opcional; nunca efectivo de la caja), comprobante, fijo (`recurrente_id`, si
  salió de uno), clave del formulario, anulación (motivo, quién y cuándo), autor y fechas. Un
  fijo tiene un solo por pagar por vencimiento, aunque esté anulado: `unique (recurrente_id,
  vencimiento)`.
- **Pagar es cargar un gasto con `gastos.por_pagar_id`.** Un trigger copia del por pagar la
  categoría, el proveedor, la descripción, el comprobante y el fijo, así no se pueden falsear,
  y exige que siga vigente (`PG209`). Un por pagar tiene un solo pago vigente: índice único
  sobre `por_pagar_id` sin los anulados. Pagar dos veces da `23505`, y anular el gasto lo deja
  por pagar de nuevo. El pago no vuelve a validar la categoría ni el proveedor, que pueden
  haberse desactivado después; el medio de pago sí.
- **Anular lo por pagar**: motivo obligatorio (`PG205`). Si ya está pagado, no se puede: hay
  que anular el pago (`PG210`). Lo anulado no cambia (`PG204`).
- **Pagar un fijo antes de que venza**: el admin crea el por pagar de ese vencimiento con
  `recurrente_id` y `vencimiento`. La base exige que la fecha sea un vencimiento del fijo,
  posterior a hoy y no anterior a `generar_desde`, y que el fijo esté activo (`PG211`). Copia
  todo lo demás del fijo. El proceso que genera, sin usuario, no pasa por esa comprobación.
- **`generar_gastos_recurrentes(hasta)`** crea por pagar, ya no gastos, para cada vencimiento
  hasta `hasta` que falte. Los vencimientos que ya tenían un gasto generado antes de este
  cambio no se vuelven a crear.
- **`pagos_pendientes()`** devuelve lo por pagar vigente y sin pago, con los nombres de la
  categoría y el proveedor y la frecuencia del fijo, ordenado por vencimiento. Corre con RLS.
- **RLS y auditoría**: el admin activo ve, carga y anula lo de su local; nadie borra; toda alta
  y anulación queda en la auditoría. Invitado, caja y encargado reciben rechazo.

### Pantalla

- **Cargar gasto.** "¿Ya lo pagaste?" (Sí / Todavía no) aparece cuando "¿Se repite?" es No.
  - Con Sí, todo sigue como hoy.
  - Con Todavía no, la fecha se llama "Vence el", acepta cualquier día y el medio dice
    "(opcional)". Al guardar, el aviso dice "Quedó por pagar" y se vuelve a Gastos.
- **Próximos pagos.** Junta lo por pagar ya cargado con el próximo pago de cada fijo activo que
  todavía no tiene su por pagar, ordenados por fecha.
  - **Cada fila**: la baldosa con la fecha, el nombre (el de un fijo lleva a su ficha), el
    detalle, el monto y el botón Pagado.
  - **El detalle** es la frecuencia, o la categoría y el proveedor, más cuándo vence: Vencido,
    Vence hoy, Mañana, En N días o la fecha.
  - **Lo vencido** lleva la marca en rosa.
  - **Lo ya cargado** suma el botón No se paga.
  - **Al pie**, "Falta pagar este mes: $X" o "Este mes no queda nada por pagar.".
  - **Sin nada**, el texto explica cómo anotar algo por pagar.
- **Ventana Pagado** (título "Pagado: «nombre»"):
  - Campos: fecha del pago (calendario hasta hoy, con Hoy y Ayer), monto y medio de pago.
  - Arrancan con hoy y con el monto y el medio de lo por pagar.
  - Al confirmar con "Anotar el pago": aviso "Pago anotado" y se refresca la pantalla.
- **Ventana No se paga**: motivo y "Confirmar"; aviso "Quitado de por pagar".
- **Ficha de un gasto**: la franja de un fijo dice "Es un pago del gasto fijo «X»"; si salió de
  un por pagar, agrega "Si lo anulás, vuelve a Próximos pagos."
- **Ficha de un fijo**: "Ya se cargaron" pasa a llamarse "Pagos".

## Casos de borde

| Caso | Qué pasa |
|---|---|
| Doble toque en "Anotar el pago" | La clave de la ventana devuelve el mismo gasto |
| Dos pestañas pagan lo mismo | La segunda recibe "Ese pago ya estaba anotado." |
| Se desactiva la categoría o el proveedor de algo por pagar | Se paga igual, con los suyos |
| Se edita el monto de un fijo | Lo por pagar ya creado conserva el suyo; se corrige al pagar |
| Se pausa un fijo con pagos vencidos | Lo vencido sigue por pagar |
| Gastos que los fijos cargaron pagados antes de este cambio | Quedan como están y no se duplican |
| Se paga un fijo antes de que venza | El proceso de ese día no lo vuelve a crear |
| Se anula el pago de algo por pagar | Vuelve a Próximos pagos |
| La fecha de un pago en el futuro | La ventana no la deja elegir y el servidor la rechaza |

## Fuera de alcance

Pagar en partes, editar lo por pagar, el aviso de vencidos en Inicio y lo por pagar en la ficha
del proveedor.

## Restricciones globales (de `CLAUDE.md`)

- TDD: primero el test, verlo fallar, después el código. Sin mocks: lo que toca datos se prueba
  contra la base de pruebas (`*.base.test.ts`); lo puro, llamándolo directo.
- Largo: funciones de hasta 20 líneas en `.ts`, componentes de hasta 80 en `.tsx`, archivos de
  hasta 300. La lógica sale de los `.tsx` a un `.ts`.
- Español rioplatense con voseo en pantalla; nombres, base y comentarios en español.
- Plata en centavos enteros (`bigint` / `number` entero, `_centavos` / `Centavos`).
- Cada operación con la sesión del usuario y RLS; la clave secreta solo para el proceso que
  genera y para sembrar y limpiar en los tests.
- Nada se borra, se anula con motivo; toda escritura deja auditoría.
- Fechas: "hoy" es el día en Argentina, lo decide el servidor y entra como parámetro.
- Pantallas con la skill `estetica-panel`.
- Cada tarea corre sus tests nuevos y `npm run tipos`; el cierre, `npm run verificar` y
  `npm run e2e` en los dos tamaños.
- Solo Santiago autoriza aplicar la migración a la base real, mergear y publicar.
- Cada archivo se suma a git con su ruta, nunca `git add -A`.

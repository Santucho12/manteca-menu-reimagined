# Cierres de caja

Módulo 11 de `PROPUESTA.md`. Séptimo paso del orden de construcción.

Este archivo tiene dos partes. La definición funcional dice qué hace el módulo y se acordó
con Santiago el 2026-10-06. La parte técnica se escribe al construirlo.

## Para qué

Que cada mañana el dueño sepa si la caja de ayer cerró, por cuánto no, y en qué medio de
pago está la diferencia.

## Quién lo usa

| Quién | Qué hace acá |
|---|---|
| Caja | Carga el cierre del día y ve los suyos |
| Admin | Ve todos, los revisa y los anula. También puede cargar uno |

## Qué declara el empleado

| Dato | Detalle |
|---|---|
| Fondo inicial | Con cuánto efectivo arrancó la caja |
| Efectivo contado | Lo que hay en la caja al cerrar |
| Un monto por cada otro medio de pago | Los medios que usa Fudo: tarjeta de crédito, tarjeta de débito, QR y transferencia |
| Retiros | Efectivo que se sacó de la caja durante el día. Monto y quién lo retiró |
| Gastos pagados con la caja | Descripción y monto de cada uno |
| Queda en la caja | Con cuánto se deja la caja para el día siguiente |
| Comentario | Opcional |

## Cómo se calcula

Lo esperado lo calcula siempre el servidor.

- **Efectivo esperado:** fondo inicial, más ventas en efectivo, menos retiros, menos gastos
  pagados con la caja.
- **Esperado de cada otro medio:** las ventas cobradas con ese medio.
- **Diferencia:** lo declarado menos lo esperado, por cada medio. Negativa es faltante;
  positiva, sobrante.

Las ventas son las de Fudo de ese día más las cargadas a mano. De las cargadas a mano, las
cobradas en efectivo de la caja suman al efectivo esperado.

Las ventas sin medio de pago y las canceladas se muestran aparte y no suman a ningún
esperado.

## Estados de un cierre

| Estado | Qué significa |
|---|---|
| Esperando ventas | Se guardó, pero todavía no entraron las ventas de ese día |
| Cierra | La diferencia de cada medio está dentro de la tolerancia |
| Con diferencia | Algún medio supera la tolerancia |
| Revisado | El admin lo miró y lo marcó |
| Anulado | No cuenta. Sigue en el historial, con su motivo |

## Pantallas

### Cargar el cierre (`/admin/caja`), pensada para el celular

- Arriba, bien visible: "Cargando como {nombre}. ¿No sos vos? Salir".
- El formulario de la tabla de arriba. **No muestra lo esperado.**
- Al guardar, el sistema trae las ventas del día y muestra el resultado: cierra, o cuánto
  falta o sobra en cada medio.
- Si hay diferencia, pide un comentario para explicarla. No es obligatorio.
- Si las ventas no pudieron traerse, avisa que el cierre quedó guardado y que el resultado
  va a estar más tarde.

### Mis cierres, para Caja

- Lista de los cierres que cargó esa persona, con su estado y su diferencia.
- No ve los de otros.

### Control de cierres, solo admin

- Lista de todos los cierres con fecha, quién lo cargó, estado y diferencia total.
- Filtros por fechas, persona y estado. La lista está paginada.
- Los días sin cierre aparecen marcados.
- Al abrir uno: lo declarado, lo esperado y la diferencia de cada medio; los retiros; los
  gastos de caja; las ventas canceladas y sin medio de pago; el comentario del empleado.
- Acciones: marcar como revisado, con comentario opcional, y anular.

### Tolerancia

- El admin define un monto. Una diferencia menor figura como "cierra" y no genera aviso. La
  diferencia se ve igual.

## Reglas

1. El empleado cuenta a ciegas: no ve lo esperado hasta guardar.
2. Un cierre por día. El segundo intento se rechaza.
3. El cierre queda a nombre de quien tiene la sesión iniciada. No se puede elegir a otro.
4. Un cierre guardado no se edita. Si está mal, el admin lo anula con motivo y se carga de
   nuevo. El anulado deja libre ese día.
5. Caja no puede anular.
6. El cierre no espera a las ventas: se guarda igual y se calcula cuando entran.
7. Cada gasto pagado con la caja crea un gasto "Sin clasificar" en Gastos, con el monto y la
   descripción que escribió el empleado.
8. Anular un cierre anula también los gastos que salieron de él.
9. Si cambian las ventas de un día con cierre revisado, el cierre se recalcula y pierde la
   marca de revisado.
10. Se puede cargar el cierre de un día anterior que quedó sin cargar. No se puede cargar
    uno de un día futuro.

## Casos de borde

- El empleado carga el cierre y después se sigue vendiendo: el cierre se recalcula en la
  próxima sincronización y queda marcado con "hubo ventas después del cierre".
- Día sin ninguna venta: lo esperado es el fondo inicial menos retiros y gastos.
- El fondo inicial de hoy no coincide con lo que se dejó ayer: el control lo marca como
  dato, sin tratarlo como diferencia.
- Un día sin cierre: aparece marcado en el control y avisado en Inicio.
- Doble toque en "Guardar": no crea dos cierres.
- El empleado se equivoca en un número: avisa al admin, que anula el cierre para que lo
  cargue de nuevo. Queda el motivo.
- Se desactiva a un empleado con cierres cargados: sus cierres siguen a su nombre.

## Qué queda en la auditoría

- Cada cierre cargado, con todo lo declarado.
- Cada revisión y cada anulación, con quién, cuándo y el motivo.
- Cada recálculo por cambio en las ventas.
- Cada cambio de la tolerancia, con el valor anterior y el nuevo.

## Fuera de alcance

- Más de un cierre por día (turnos).
- Que Caja edite un cierre guardado.
- Arqueos parciales durante el día.
- Conciliar con el resumen del banco o de la tarjeta.
- Vencimiento de la sesión o pedir la contraseña al guardar.

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Lo esperado antes de declarar | No se muestra |
| La diferencia después de guardar | Se muestra, y el empleado puede comentar |
| Corregir un cierre | Lo anula el admin y se carga de nuevo |
| Diferencias chicas | Tolerancia que define el admin |
| Fondo de cambio | Se declara en cada cierre, precargado con lo que quedó en la caja el día anterior |
| Turnos | Un cierre por día (Santiago, 2026-10-09) |
| Tolerancia de arranque | $500; el admin la cambia |
| Fecha del cierre | Se ve, con hoy por defecto; no acepta días futuros |
| Quién retiró | Texto libre |
| Gasto que sale de un cierre | En Gastos se clasifica; su monto, su fecha y su medio se corrigen anulando el cierre |
| Antes de que exista Ventas | El cierre se guarda y queda "Esperando ventas" |

## Sin decidir

| Qué | De qué depende |
|---|---|
| Si el cliente necesita un cierre por turno | Del cliente. Hoy es uno por día |

## Parte técnica

Construido el 2026-10-09 (pedido 28). El detalle está en
`docs/superpowers/specs/2026-10-09-cierres-de-caja-design.md`.

- **Base:** tablas `cierres_de_caja`, `retiros_de_caja` y `configuracion_de_caja`, y la
  columna `cierre_id` en `gastos`. Un índice único deja un solo cierre sin anular por día.
- **Guardar:** `cierres_guardar` crea el cierre a nombre de la sesión, sus retiros y un
  gasto "Sin clasificar" por cada gasto de caja, todo junto o nada. Rechaza un día futuro
  (`PC301`) y un segundo cierre del día (`PC302`). Caja no escribe en Gastos.
- **Permisos:** Caja ve sus cierres, sus retiros y los gastos que declaró; el admin ve los
  de su local, los revisa y los anula. Nadie inserta directo ni borra.
- **Reglas:** un cierre anulado no se cambia (`PC303`); anular pide motivo (`PC304`) y anula
  sus gastos; un gasto de caja no cambia monto, fecha ni medio (`PC305`) ni se anula suelto
  (`PC306`).
- **Cálculo:** `resultadoDelCierre` (`src/lib/caja/resultado.ts`) da lo esperado, la
  diferencia y el estado por medio, con la tolerancia. Está probado; todavía no se usa
  porque no hay ventas.
- **Pantallas:** `/admin/caja` (carga), `/admin/caja/mis-cierres`, `/admin/caja/control`
  (tolerancia, filtros, días sin cierre) y `/admin/caja/cierres/[id]`.

Queda para el módulo de Ventas: traer las ventas del día al guardar, completar lo esperado,
pasar el cierre a "Cierra" o "Con diferencia", recalcular cuando cambian las ventas (reglas
6 y 9, y "hubo ventas después del cierre") y pedir el comentario si hay diferencia. El aviso
de días sin cierre en Inicio entra con Inicio.

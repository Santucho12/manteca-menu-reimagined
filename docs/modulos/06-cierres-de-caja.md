# Cierres de caja

Módulo 11 de `PROPUESTA.md`. Séptimo paso del orden de construcción.

Este archivo tiene dos partes. La definición funcional dice qué hace el módulo y se acordó
con Santiago el 2026-10-06. Desde el pedido 89 (2026-11-18) las ventas se cargan en el sistema
en el momento de cobrar, sin Fudo. La parte técnica se escribe al construirlo.

## Para qué

Que cada mañana el dueño sepa si la caja de ayer cerró, por cuánto no, y en qué medio de
pago está la diferencia.

## Quién lo usa

| Quién | Qué hace acá |
|---|---|
| Caja | Vende en el mostrador (ver `05-ventas.md`), carga el cierre del día y ve los suyos |
| Admin | Ve todos, los revisa y los anula. También puede cargar uno |

## Qué declara el empleado

| Dato | Detalle |
|---|---|
| Fondo inicial | Con cuánto efectivo arrancó la caja |
| Efectivo contado | Lo que hay en la caja al cerrar |
| Un monto por cada otro medio de pago | Tarjeta de crédito, tarjeta de débito, QR y transferencia |
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

Las ventas son las de ese día cobradas en la caja del local: todas las del mostrador y las
cargadas a mano con "Se cobró en la caja del local" marcada (pedido 89). Una venta mayorista
cobrada por transferencia a otra cuenta no cambia lo esperado de la caja. Con dos medios,
cada parte suma a su medio.

Las ventas anuladas no suman a ningún esperado.

## Estados de un cierre

Rediseño del 2026-10-28 (pedido 66): dos estados y uno para lo que falta. El estado **no se
guarda**: se calcula siempre al mostrar, contra las ventas del día en ese momento.

| Estado | Qué significa |
|---|---|
| Cierra | La diferencia de cada medio con las ventas del día está dentro de la tolerancia |
| Con diferencia | Algún medio supera la tolerancia (sin ventas ese día, lo esperado es $0) |
| Pendiente | El día todavía no tiene cierre cargado |
| No abrió | El admin marcó que ese día el local no abrió: no es pendiente ni avisa en Inicio (pedido 85) |

Un cierre anulado no es un estado: sigue en el historial con su motivo y se ve con «Ver anulados».
«Revisado» ya no existe.

«Esperando ventas» ya no existe (pedido 89). Lo había sumado el pedido 84, mientras las ventas
entraban por el Excel de Fudo días después. Ahora se cargan en el momento de cobrar, y todo
cierre tiene resultado desde que se guarda.

## Pantallas

### Cargar el cierre (`/admin/caja`), pensada para el celular

- Arriba, bien visible: "Cargando como {nombre}. ¿No sos vos? Salir".
- El formulario de la tabla de arriba. **No muestra lo esperado.**
- Al guardar, muestra el resultado con las ventas del día: cierra, o cuánto falta o sobra en
  cada medio.
- Si hay diferencia, pide un comentario para explicarla. No es obligatorio.

### Mis cierres, para Caja

- Lista de los cierres que cargó esa persona, con su estado y su diferencia.
- No ve los de otros.

### Control de cierres, solo admin

- Lista de todos los cierres con fecha, quién lo cargó, estado y la diferencia de cada medio
  (pedido 85: un faltante en un medio y un sobrante en otro no se compensan).
- Filtros por fechas, persona y estado. La lista está paginada.
- Los días sin cierre aparecen marcados. Cada uno tiene "No abrió", que lo saca de pendientes y
  lo pasa a la lista "Días que no abrió", con "Deshacer" (pedido 85). Un día con cierre sin
  anular o un día futuro no se marcan; si después se carga un cierre de un día marcado, la
  marca se desactiva sola.
- Al abrir uno: lo declarado, lo esperado y la diferencia de cada medio; los retiros; los
  gastos de caja; las ventas canceladas y sin medio de pago; el comentario del empleado.
- Acciones: editar y anular, las dos solo del admin. No se marca como revisado.

### Tolerancia

- El admin define un monto. Una diferencia menor figura como "cierra" y no genera aviso. La
  diferencia se ve igual.

## Reglas

1. El empleado cuenta a ciegas: no ve lo esperado hasta guardar.
2. Un cierre por turno: dos turnos por día, Mediodía y Noche (pedido 98). El segundo intento del
   mismo turno se rechaza.
3. El cierre queda a nombre de quien tiene la sesión iniciada. No se puede elegir a otro.
4. Un cierre guardado lo edita solo el admin (pedido 85; antes Caja editaba el suyo). Caja ve
   "¿Algo está mal? Avisale a un administrador". Cada cambio queda
   en la auditoría con el valor anterior y el nuevo. El admin puede anularlo, con motivo; el
   anulado deja libre ese día.
5. Caja no puede editar ni anular.
6. El cierre no espera a las ventas: se guarda igual y su resultado se calcula al mostrarlo.
7. Cada gasto pagado con la caja crea un gasto "Sin clasificar" en Gastos, con el monto y la
   descripción que escribió el empleado.
8. Anular un cierre anula también los gastos que salieron de él.
9. Si cambian las ventas de un día, el resultado cambia solo, porque se calcula al mostrar.
10. Se puede cargar el cierre de un día anterior que quedó sin cargar. No se puede cargar
    uno de un día futuro.

## Casos de borde

- El empleado carga el cierre y después se sigue vendiendo: el resultado del cierre cambia
  solo, porque se calcula al mostrar, y puede quedar con diferencia.
- Día sin ninguna venta: lo esperado es el fondo inicial menos retiros y gastos.
- Bajar el fondo inicial o declarar un retiro de más tapa un faltante: el control muestra lo
  retirado en cada cierre y marca "Fondo distinto"; el detalle dice cuánto (Santiago,
  2026-10-12).
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

- Más de dos turnos por día, o un turno que cruza la medianoche.
- La sección de PedidosYa y otras plataformas en el cierre: va con el pedido 91.
- Que Caja edite un cierre guardado.
- Arqueos parciales durante el día.
- Conciliar con el resumen del banco o de la tarjeta.
- Vencimiento de la sesión o pedir la contraseña al guardar.

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Lo esperado antes de declarar | No se muestra, ni lo vendido en el día en la pantalla de Vender (pedido 89) |
| Qué ventas suma lo esperado | Las cobradas en la caja del local: las del mostrador y las cargadas a mano con la casilla marcada (pedido 89) |
| La diferencia después de guardar | Se muestra, y el empleado puede comentar |
| Corregir un cierre | Lo edita el admin (pedido 85); desde el 2026-10-28 se editaba, antes se anulaba y se cargaba de nuevo |
| Diferencias chicas | Tolerancia que define el admin |
| Fondo de cambio | Se declara en cada cierre, precargado con lo que quedó en el último cierre anterior; si ese no es el de ayer, un aviso dice de qué día viene |
| Turnos | Dos por día, Mediodía y Noche, cada uno con su cierre (Santiago, 2026-11-19, pedido 98; antes, uno por día) |
| Hora del cierre | Una por turno, fija y configurable por el admin; arranca en 16:00 y 23:00 hasta saber las de Manteca |
| A esa hora | Vender se traba hasta cargar el cierre, con «Postergar 10 min» sin límite y cada postergación registrada (Santiago, pedido 98) |
| Qué ventas son de cada turno | Cada venta guarda su turno al cobrarse: lo vendido mientras se posterga queda en el turno que se está por cerrar (pedido 98) |
| Turno sin ventas | No traba ni queda pendiente: el local no abrió ese turno (pedido 98) |
| Tolerancia de arranque | $500; el admin la cambia |
| Fecha del cierre | Se ve, con hoy por defecto; no acepta días futuros |
| Quién retiró | Texto libre |
| Gasto que sale de un cierre | En Gastos se clasifica; su monto, su fecha y su medio se corrigen anulando el cierre |
| Sin ventas ese día | Lo esperado es $0 y el cierre queda «Con diferencia» (2026-10-28) |

## Sin decidir

| Qué | De qué depende |
|---|---|
| A qué hora cierra cada turno en Manteca | Del cliente. Arranca en 16:00 y 23:00, y el admin las cambia |

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

**Esperando ventas (pedido 84, 2026-11-08).** Migración
`20261105120000_excel_de_fudo_en_el_sistema`: `cierres_con_resultado` devuelve además
`ventas_cargadas` (hay una venta `origen = 'fudo'` sin anular, del mismo local, con fecha mayor
o igual a la del cierre). Es solo un sí o un no: Caja lo recibe sin ningún monto de ventas.
`resultadoDeFila` (`src/lib/caja/`) da `esperando_ventas` cuando es falso, con lo declarado y
esperado y diferencia en 0; el reporte de Caja recibe `diferenciaCentavos: null` para esos
cierres. Pruebas: `tests/servicios/excel-en-el-sistema.base.test.ts`, los puros de
`src/lib/caja` y `src/lib/reportes`, `e2e/caja.spec.ts` y `e2e/caja-control.spec.ts`. El pedido
89 lo saca: las ventas se cargan en el momento.

**Lo cobrado en la caja (pedido 89).** Migración `20261118120100_vender_en_el_mostrador`:
`cierres_con_resultado` deja de devolver `ventas_cargadas` y suma solo las ventas con
`en_la_caja`. `resultadoDeFila` compara siempre; el estado `esperando_ventas` ya no existe.
Pruebas: `tests/servicios/caja-con-el-mostrador.base.test.ts` y los puros de `src/lib/caja`.

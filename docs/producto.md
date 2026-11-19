# Producto: primera fase

Documento interno. Delimita qué es el producto en la primera fase, para quién es y qué deja
afuera. Toda definición de módulo parte de acá. Acordado con Santiago el 2026-10-06.

## Qué es

> El lugar donde el dueño de Manteca ve todos los días si la plata cierra (cuánto entró,
> cuánto salió y si la caja coincide) y desde donde actualiza su menú sin depender de nadie.

No son nueve módulos sueltos: son dos productos y un soporte.

| Pieza | Qué resuelve | Módulos |
|---|---|---|
| Control de plata | "¿Cuánto vendí, cuánto gasté, cuánto me quedó y por qué no cierra la caja?" | Ventas, Cierres de caja, Gastos, Inicio, Reportes |
| Menú autogestionado | "Quiero cambiar un precio hoy, sin llamar a nadie" | Menú y página pública |
| Soporte | Que cada número tenga un responsable | Usuarios, Auditoría, Proveedores |

## Para quién

| Quién | Qué hace | Desde dónde |
|---|---|---|
| Dueño (Admin) | Mira los números, revisa los cierres, carga gastos, cambia el menú, administra usuarios | Celular y computadora |
| Empleado de caja (Caja) | Vende en el mostrador y carga el cierre de su turno | La pantalla táctil del mostrador; el cierre, también desde el celular |
| Cliente del local | Lee el menú desde el QR | Celular, sin cuenta |

El rol Encargado queda fuera de esta fase: no tiene una tarea propia. Existe en la base,
pero no se puede asignar y no accede a nada.

## Qué no es

- No procesa pagos ni factura: registra lo que se cobró.
- No calcula cuánto cuesta ni cuánto deja cada producto.
- No lleva stock ni producción. Materia prima tiene los insumos y lo que cuesta cada uno hoy,
  sin stock (pedido 94, por excepción de Santiago); recetas, costos y compras llegan con los
  pedidos 95 a 97.
- No es contabilidad ni facturación.
- No lleva la cuenta corriente de los proveedores.

Lo que el cliente pida de esta lista es segunda fase.

## Cuándo la fase salió bien

1. El dueño cambia un precio en menos de un minuto, sin nosotros.
2. El cierre se carga desde el celular en menos de tres minutos.
3. Cada mañana el dueño sabe si la caja de ayer cerró y por cuánto no.
4. A fin de mes ve ventas, gastos y resultado sin abrir un Excel.
5. De cualquier número se puede saber quién lo cargó.

Una función que no ayuda a ninguna de las cinco no entra.

## Decisiones de producto

### La compra de mercadería es un gasto

La propuesta dice que las compras de materia prima no son gastos: van al módulo Compras, que
es de la segunda fase. Sin ese módulo, la harina y la manteca no quedarían registradas y
"ventas menos gastos" mostraría una ganancia inflada.

En esta fase la compra de mercadería se carga como un gasto, en su propia categoría y con su
proveedor. Así el resultado del mes es real, y Proveedores muestra cuánto se le pagó a cada
uno. Cuando exista Compras, esos gastos pasan a ese módulo.

Falta reflejarlo en `PROPUESTA.md`, con el texto que defina Santiago.

### Caja vende y carga su cierre, nada más

Caja vende en el mostrador, carga el cierre de su turno y ve sus propios cierres (Santiago,
2026-11-18, pedido 89; antes solo cargaba el cierre). No ve los cierres de otros, ni las ventas,
ni lo vendido en el día, ni los gastos, ni el resto del sistema: así cuenta la caja a ciegas.

### Inicio y Reportes no se pisan

- Inicio contesta "cómo vengo" en una pantalla, sin filtros.
- Reportes es para investigar, con fechas y comparaciones.

Los números de los dos salen del mismo cálculo, para que no se contradigan.

### El resultado se llama por lo que es

Sin costos por producto no hay margen. Lo que se muestra es el resultado del mes: ventas
menos gastos. No se usa la palabra "margen" en esta fase.

## Consecuencias para el diseño

- Caja e Inicio se diseñan primero para el celular. El resto, para la computadora, y tiene
  que poder usarse en el teléfono.
- El aumento masivo de precios lleva redondeo (por ejemplo, a $100). Con inflación, es la
  función del menú que más se va a usar.
- El menú se entrega primero: es independiente y se ve.

### Las ventas se cargan en el mostrador

Manteca dejó Fudo (Santiago, 2026-11-18, pedido 89). Cada venta se carga en el sistema en el
momento de cobrar, desde la pantalla Vender: táctil, en una computadora o una tablet del
mostrador. Solo mostrador, sin mesas. Se paga con uno o dos medios. Se arrancó de cero, sin
traer el historial de Fudo.

- Caja vende al precio del menú, sin cambiarlo ni hacer descuentos, y no anula.
- Lo esperado de la caja suma solo lo cobrado en la caja del local.
- La facturación sigue fuera del sistema, como antes.

Antes de esto, las ventas iban a entrar de Fudo por su API, y mientras tanto se subía su Excel
"Reporte-Ventas" (pedidos 59 y 84).

## Sin decidir

| Qué | De qué depende | Qué cambia |
|---|---|---|
| A qué hora cierra el local | Del cliente | Si cierra después de medianoche, la fecha del cierre tiene que venir con el día anterior: hoy viene con el día de hoy y el cierre quedaría en el día equivocado |

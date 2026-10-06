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
| Empleado de caja (Caja) | Carga el cierre de su turno | Celular, al final del turno |
| Cliente del local | Lee el menú desde el QR | Celular, sin cuenta |

El rol Encargado queda fuera de esta fase: no tiene una tarea propia. Existe en la base,
pero no se puede asignar y no accede a nada.

## Qué no es

- No cobra ni reemplaza a Fudo.
- No calcula cuánto cuesta ni cuánto deja cada producto.
- No lleva stock, producción ni recetas.
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

### Caja carga su cierre y nada más

Caja carga el cierre de su turno y ve sus propios cierres. No ve los de otros, ni las
ventas, ni los gastos, ni el resto del sistema.

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
- El menú se entrega primero: es independiente, se ve y no depende de Fudo.

## Sin decidir

| Qué | De qué depende | Qué cambia |
|---|---|---|
| Si las ventas entran por la API de Fudo o subiendo el Excel | Del plan de Fudo que tenga el cliente. Santiago lo pregunta | Con la API las ventas entran solas. Con el Excel hay un paso manual todos los días, y hay que definir quién lo hace |
| Qué detalle traen las ventas (por ticket, por turno, por medio de pago) | De un archivo real o de la respuesta de la API | Si lo esperado de un cierre se puede calcular por medio de pago |

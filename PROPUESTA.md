# Sistema a Medida para Manteca

Sistema a medida diseñado para monitorear y optimizar la producción, costos, ventas y administración de Manteca. Centraliza datos de proveedores, costos, stock, producción, ventas y finanzas en una única plataforma.

En una primera fase, el sistema operará únicamente para Manteca. Posteriormente, la idea sería escalarlo y replicarlo en sus diferentes locales.

---

# 1. Usuarios y permisos

Cada persona del equipo tendrá su cuenta (nos servirá para auditar). Se registra con nombre, email y contraseña. Ni bien se registran, quedan como "invitado" sin poder ver ni hacer nada. Desde el panel de administración desarrollaremos un apartado de Usuarios de staff donde se asigna el rol correspondiente a cada persona:

* **Admin:** acceso total al sistema
* **Encargado:** (alcance a definir)
* **Caja:** (alcance a definir)

También van a poder desactivar usuarios, resetear contraseñas y cambiar permisos cuando sea necesario.

**Se conecta con los siguientes módulos:**

* **Auditoría:** cada dato que se crea, modifica o anula queda registrado con el usuario que lo hizo
* **Cierres de caja:** cada cierre queda a nombre del empleado que lo cargó
* **Centro de avisos:** cuando alguien se registra como invitado, se genera un aviso para asignarle el rol

---

# 2. Proveedores

Módulo donde cargás la información de tus proveedores. Para cada proveedor guardás:

* Nombre y datos de contacto (teléfono/WhatsApp o ubicación)
* Materias primas que vende y el precio que te cobra por cada una
* Observaciones: campo libre para anotar alguna nota o algo que quieras recordar

**Se conecta con los siguientes módulos:**

* **Materia prima:** un mismo insumo puede tener varios proveedores, cada uno con su precio, así podés comparar a quién te conviene comprarle
* **Compras:** la orden de compra se arma con los precios de cada proveedor y se le envía por WhatsApp con un simple click (botón directo)

---

# 3. Materia prima

Módulo donde cargás todos los insumos que usás en la producción (harina, manteca, azúcar, leche, huevos, etc.).

Para cada insumo guardás:

* **Unidad de compra y unidad de uso:** se compra por bolsa de 25 kg, maple de 30 huevos o caja de 10 kg, pero los productos usan gramos o unidades. El sistema hace la conversión solo: cargás "entró 1 bolsa de harina" y suma 25.000 g al stock
* **Proveedores:** uno o varios, cada uno con su precio
* **Costo actual:** en base a lo que te cobra el proveedor
* **Stock mínimo** (opcional): si el stock baja de ese nivel, se genera un aviso

**Se conecta con los siguientes módulos:**

* **Productos:** cada insumo forma parte de la composición de los productos
* **Compras:** cada compra recibida suma stock y actualiza el costo actual
* **Costos:** el costo actual de cada insumo determina el costo de los productos
* **Centro de avisos:** si el stock baja del mínimo, se genera un aviso de stock bajo

---

# 4. Productos

Se crean los productos indicando qué materia prima lleva, qué insumos lleva, cuánto rinde, cuánto cuesta y a cuánto se vende.

Y con eso vamos a saber:

* Qué insumos lleva
* Cuánto nos cuesta en base a esos insumos
* Cuánto vale según el precio publicado en el menú web
* Qué ganancia se está obteniendo

**Se conecta con los siguientes módulos:**

* **Materia prima:** la composición de cada producto se arma con los insumos cargados
* **Costos:** el costo de cada producto y de cada variante sale de su composición
* **Menú web:** cada producto del menú está vinculado a un producto del sistema, con sus mismas variantes y precios y en base a esto tenemos el precio de venta

---

# 5. Compras y pedidos a proveedores

* **Orden de compra:** se arma el pedido con los insumos (o productos de reventa tipo botellas de agua,gaseosa o etc), las cantidades y el precio de cada proveedor
* Con un simple clic, hacer el pedido directamente por WhatsApp
* **Recepción:** al marcar que llegó el pedido se carga lo que realmente llegó y a qué precio(porque siempre pasa que pedis abc y te mandan ab, c no). con eso se recalcula el stock
- **Factura y pago**: cada compra se registra con su factura y queda como pagada en el momento (en efectivo, con la caja o por transferencia) o a pagar, con su fecha de vencimiento. Las compras a pagar suman al saldo de la cuenta corriente del proveedor


**Se conecta con los siguientes módulos:**

* **Proveedores:** la orden se arma con los precios de cada proveedor y se envía a su WhatsApp
* **Materia prima:** al recibir una compra se actualiza el costo actual y el stock
* **Stock:** lo recibido suma al stock
* **Costos:** si cambió el precio, se recalculan los productos afectados

---

# 6. Gestión de costos

El costo de cada producto sale automáticamente de su composición y del precio actual de cada materia prima.

* **Costo automático de cada producto y de cada variante:** se calcula a partir de los insumos que lleva, con opción de aplicar porcentaje de desperdicio
* **Ganancia por producto:** cada producto tiene su precio de venta (el mismo que se publica en el menú) y su costo, así que el sistema muestra cuánto ganás con cada uno, en pesos y en porcentaje. Por ejemplo: si la medialuna se vende a $1.000 y cuesta $350, ganás $650 por unidad (65%). Se calcula también para cada variante (unidad, media docena, docena)
* **Precio de venta sugerido** según el margen objetivo
* **Alertas** cuando un producto queda por debajo del margen mínimo
* **Ranking de productos** más y menos rentables (por porcentaje de ganancia y por plata total que dejan)

**Se conecta con los siguientes módulos:**

* **Materia prima y Compras:** cuando cambia el costo de un insumo, se recalculan todos los productos que lo usan
* **Ventas:** la ganancia total por producto sale de cruzar la ganancia por unidad con las unidades vendidas
* **Menú web:** el precio de venta es el mismo que se publica en la web
* **Centro de avisos:** un producto por debajo del margen mínimo genera un aviso

---

# 7. Producción

Registro de lo que se elabora cada día.

* Se registra por tandas: al cargar "2 tandas de medialunas", el sistema **descuenta automáticamente la materia prima** según la composición del producto y **suma el stock del producto terminado**
* **Rendimiento real vs. esperado:** se carga cuántas unidades salieron realmente. Si la tanda rinde 48 y salieron 44, la diferencia queda registrada como merma de producción, con su motivo (se quemaron, salieron deformes, etc.)
* **Costo de la merma de producción:** el costo de cada producto sigue siendo el que sale de su composición, y las unidades que faltaron se valorizan a ese costo. Por ejemplo: si la tanda de 48 medialunas cuesta $16.800 ($350 cada una) y salieron 44, las 4 que faltaron son $1.400 de merma de producción. Así la pérdida queda a la vista en los reportes de mermas, en lugar de esconderse dentro del costo de la medialuna

**Se conecta con los siguientes módulos:**

* **Productos:** la composición define qué se descuenta y cuánto debería rendir cada tanda
* **Stock:** producir descuenta materia prima y suma producto terminado
* **Reportes y Dashboard:** consumo de materia prima, mermas y rendimiento real

---

# 8. Stock

Stock de materia prima y productos terminados.

* **Stock de materia prima:** aumenta con las compras (pedidos a proveedores recibidos) y disminuye con la producción y con la venta de productos elaborados al momento
* **Stock de productos:** aumenta con la producción (o con la compra, en productos de reventa) y disminuye con las ventas
* **Conteos físicos (inventario):** se carga lo que realmente hay y el sistema muestra las diferencias contra el stock teórico. Así se detecta dónde se escapa la mercadería: si según el sistema tendrían que quedar 10 medialunas y quedan 7, hay 3 que salieron sin registrarse. ¿Qué pasó?
* **Mermas y desperdicio:** registro con motivo (se quemó, se venció, se cayó, devolución, cortesía/regalo, consumo del personal)
* **Stock negativo:** si al importar las ventas un producto queda con stock negativo (por ejemplo, se vendieron medialunas que nadie registró como producidas), el sistema genera un aviso de "falta cargar producción". Así el stock no se desfasa sin que nadie lo note

**Se conecta con los siguientes módulos:**

* **Compras:** las compras recibidas suman stock de materia prima y de productos de reventa
* **Producción:** descuenta insumos y preparaciones intermedias, y suma productos terminados
* **Ventas:** cada venta, importada o cargada a mano, descuenta stock
* **Materia prima:** el valor del stock se calcula con el costo actual de cada insumo
* **Centro de avisos:** el stock bajo y el stock negativo generan avisos
* **Dashboard:** valor del stock y mermas del mes

---

# 9. Gestión del menú digital

Administración del menú digital publicado en la web de Manteca directamente desde el sistema y sin tocar código.

## Situación actual

* Los productos, precios, descripciones y categorías están **escritos en el código**.
* Cualquier cambio de precio requiere editar el código y volver a publicar el sitio.

## Qué se gestiona desde el sistema

* **Categorías o secciones** del menú (Facturas, Laminados, Panes, Café, Clásicos, etc.): nombre, subtítulo y orden
* **Productos del menú**, vinculados a los productos del sistema:

  * Nombre público y descripción. La foto es de la categoría, como en la página actual
  * **Variantes de precio:** tamaños (mediano / grande) y presentaciones (unidad, media docena, docena). Son las mismas variantes del producto, cada una con su costo y su ganancia
  * Orden dentro de la categoría
* **Visibilidad:** mostrar u ocultar un producto o una categoría completa
* **Precios:**
  * Poder modificarlos. Este es el mismo precio con el que se calcula la ganancia de cada producto
  * **Actualización masiva:** subir un porcentaje a toda una categoría o a todo el menú

**Se conecta con los siguientes módulos:**

* **Productos:** cada producto del menú está vinculado a un producto del sistema, con las mismas variantes
* **Costos:** el precio publicado es el mismo con el que se calcula la ganancia, así que cada cambio de precio impacta en el margen del producto

---

# 10. Ventas e ingresos (importadas desde Fudo)

Las ventas se siguen cobrando en Fudo como hasta ahora. El sistema no reemplaza a Fudo: toma sus ventas para cruzarlas con los costos, el stock y la caja.

* **Importación del reporte de Fudo:** al cierre de cada turno o del día se exporta el Excel de ventas desde Fudo y se sube al sistema. Las ventas que pasan por Fudo no se cargan a mano
* **Vinculación de productos:** la primera vez se vincula cada producto de Fudo con su producto en el sistema. Luego hay que agregarle el resto de detalles que en Fudo no tenés pero sí en el sistema, como la materia prima que lleva, etc.
* **Control de duplicados:** si se sube dos veces el mismo período, el sistema lo detecta y no duplica las ventas
* **Anular una importación:** si se subió un archivo equivocado, se anula la importación completa. Se revierten todas sus ventas y lo que generaron (descuentos de stock, caja esperada), queda registrado quién la anuló y por qué, y después se sube el archivo correcto
* **Ventas fuera de Fudo:** las ventas que no pasan por Fudo (Cheaf, encargos, ventas a otros comercios) se cargan a mano con producto, cantidad, precio, medio de pago y canal. Tienen el mismo efecto que las importadas: descuentan stock, suman a los reportes y, si se cobraron con la caja del local, a la caja esperada del día o del turno

*El nivel de detalle (por ticket, por hora, por medio de pago) depende de las columnas que exporte Fudo.*

**A futuro:** reemplazar Fudo.

**Se conecta con los siguientes módulos:**

* **Productos:** cada producto de Fudo se vincula con un producto del sistema, y su tipo define qué se descuenta
* **Stock:** cada venta descuenta stock
* **Costos:** ganancia real y ganancia total por producto
* **Cierres de caja:** las ventas del día o del turno definen lo esperado en la caja
* **Dashboard y Reportes:** ventas, ticket promedio y reportes por producto, categoría y período

---

# 11. Cierres de caja

* El empleado carga el cierre de cada día (o de cada turno, si hay más de uno): efectivo, tarjetas, QR/Mercado Pago, transferencias, retiros, gastos y compras pagados con la caja
* El sistema calcula lo **esperado vs. lo declarado** y marca faltantes y sobrantes. Lo esperado sale de las ventas del día o del turno importadas desde Fudo
* **Control desde administración:** el administrador ve todos los cierres con sus diferencias, faltantes y sobrantes, y marca cada uno como revisado, con un comentario si hace falta
* **Para qué sirve:** además de detectar faltantes, permite ver en qué turno y en qué medio de pago no cierra la cuenta, y así encontrar el motivo: un vuelto mal dado, un cobro que no se registró en Fudo o un gasto pagado con la caja que no se cargó

**Se conecta con los siguientes módulos:**

* **Ventas:** lo esperado sale de las ventas del día o del turno
* **Gastos:** los gastos pagados con la caja se registran automáticamente como gasto
* **Usuarios:** cada cierre queda a nombre del empleado que lo cargó
* **Centro de avisos y Dashboard:** una caja con diferencia genera un aviso

---

# 12. Gastos

* Carga de gastos por categoría: alquiler, servicios, sueldos, impuestos, etc.
* Gastos únicos (los que surgen en el momento) o recurrentes (los que se repiten todos los meses: se cargan una vez y se generan solos cada mes)
* Las compras de materia prima **no se cargan como gasto**: se registran en Compras y su costo impacta en el resultado a medida que se venden los productos. Así no se cuentan dos veces. Si una compra se paga con plata de la caja, se registra como compra, no como gasto

**Se conecta con los siguientes módulos:**

* **Compras:** las compras de materia prima se registran en Compras, no en Gastos
* **Dashboard:** los gastos se restan para calcular el resultado, y sus pagos y vencimientos entran en el flujo de fondos

---

# 13. Dashboard general

* **KPIs del mes:** ventas, gastos, margen y ticket promedio (el ticket promedio depende de que el reporte de Fudo traiga el detalle por ticket)
* **Gráficos comparativos mes a mes:** ventas, gastos y resultado de cada mes, para ver la evolución del negocio en el tiempo. También se pueden comparar meses o fechas filtradas
* **Panel de producción:** productos más vendidos, más rentables, mermas del mes y valor del stock
* **Alertas visibles:** cajas con diferencias, stock bajo, productos con margen bajo

**Se conecta con los siguientes módulos:**

* **Ventas:** ventas del período, ticket promedio
* **Costos:** costo de los productos vendidos y productos más rentables
* **Producción y Stock:** mermas del mes y valor del stock
* **Cierres de caja:** cierres de caja

---

# 14. Reportes

* **Filtros por fechas y comparación entre meses** en todos los reportes, para entender rápido cómo viene funcionando el negocio
* **Reportes de ventas:** por producto, categoría, período
* **Reportes de gastos:** por categoría y período
* **Reportes de caja:** diferencias por día, turno y empleado

**Se conecta con los siguientes módulos:**

* **Ventas:** ventas por producto, categoría y período
* **Gastos:** gastos por categoría y período
* **Cierres de caja:** diferencias por día, turno y empleado

---

# 15. Centro de avisos

Hub centralizado donde el dueño ve todo lo que requiere atención, sin que nada se le pase por alto:

* **Avisos operativos:** caja con diferencia, stock bajo, stock negativo — falta cargar producción, producto por debajo del margen mínimo, producto de Fudo sin vincular, recordatorios de notas
* **Avisos administrativos:** empleado nuevo registrado como invitado, pendiente de asignarle un rol
* **Estado de cada aviso:** nuevo, visto y también se deben poder eliminar

**Se conecta con los siguientes módulos:**

Recibe los avisos que generan Usuarios, Proveedores, Materia prima, Costos, Stock, Ventas, Cierres de caja, Gastos y Notas.

---

# 16. Notas y comunicación interna

Espacio para anotar y comunicar información dentro del sistema, sin depender de cosas sueltas.

* **Notas personales:** privadas, solo las ven los admins

* **Notas compartidas:** visibles para todo el equipo, tipo dejo algo en el sistema para que se acuerden. Por ejemplo: martes 21 pagarle a X proveedor. Los empleados también deberían poder dejar notas tipo:

  * Me devolvieron este producto
  * La caja me dio mal por X cosa
  * Recordar que hay que pagar X servicio

* **Listas de tareas (checklists)** dentro de una nota, con casillas para ir tachando.

Por ejemplo:

1. Entrar las sillas de afuera para que no se mojen
2. Poner una alfombra en la entrada para que no ensucien
3. Etc.

También puede estar bueno para dejar como un checklist de todo lo que hay que hacer cuando abrís el local a la mañana o de todo lo que hay que hacer un domingo antes de cerrar, etc.

**Se conecta con:**

* **Centro de avisos:** los recordatorios llegan como aviso dentro del sistema

---

# 17. Auditoría

* Registro de quién creó, modificó o anuló cada dato y cuándo. De cada modificación se guarda el valor anterior y el nuevo. Es un rastreo dentro del sistema; por eso es importante que cada empleado tenga su propio usuario
* **Nada se borra, se anula:** ventas, cierres de caja, compras, gastos y movimientos de stock no se pueden eliminar. Si algo se cargó mal, se anula indicando el motivo, y queda registrado quién lo hizo y cuándo. Lo anulado deja de contar en los números, pero sigue visible en el historial. Una importación de ventas de Fudo también se puede anular completa, con todas sus ventas
* Los productos, insumos y proveedores que ya no se usan se desactivan: dejan de aparecer para cargar datos nuevos, pero se conserva todo su historial

**Se conecta con:**

* **Usuarios:** cada registro queda asociado al usuario que hizo la acción
* **Ventas, Cierres de caja, Compras, Gastos, Producción y Stock:** todo lo que se carga en estos módulos se anula en lugar de borrarse

---

# 18. Extras / IA

## Ideas de promociones y contenido

* **Apartado de ideas de promociones y contenido:** asistente con IA que recomienda qué hacer en base a stock, últimos productos vendidos, etc.

Si bien la realidad es que esto lo pueden hacer ustedes o le podrían preguntar directamente a la IA, no es lo mismo que si la tenés integrada al sistema, porque tiene conocimiento. En este caso, la IA vería su stock, sus últimas ventas, lo que les queda de materia prima, etc.

## Asistente de día

Consultar en lenguaje natural:

> "¿Cuánto me cuesta hoy el croissant de chocolate y cuánto aumentó desde enero?"

**Se conecta con:**

* **Stock, Ventas, Materia prima y Costos:** la IA consulta estos datos para responder y para recomendar promociones

---


# 18. Etapas del desarrollo

## primera fase

Para mí, todo es importante, está buenísimo y es indispensable. Si nos ponemos a desarrollar esto, tardaré un montón y es un montón de plata. Entonces, como para comenzar me guio en base a lo que me pediste en el msj que entiendo que son sus prioridades 

 Yo arrancaría con:
- usuarios y permisos
- proveedores
- gestión del menú digital
- ventas e ingresos importados de Fudo
- cierre de caja
- gastos
- dashboard general
- reportes
- auditoría

## segunda fase
en base a lo que vayamos notando que necesitan ir agregando el resto de los modulos o cosas nuevas que se les ocurran o necesidades que aparezcan
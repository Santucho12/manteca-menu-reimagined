# Pedidos

Registro de los pedidos que cambian la aplicación del Sistema Manteca. Las reglas de cómo se mantiene
este archivo están en `CLAUDE.md`.

Un pedido pasa a **Completados** solo cuando se hizo, corrieron todos los tests y se probó
en el navegador con Playwright. Los pedidos sin código (documentación, configuración) se
completan cuando se verificó el resultado, y se anota cómo.

## Todos los pedidos

### 1. Repositorio privado en GitHub
Armar un repo privado de GitHub para el proyecto.

### 2. Base de datos
Crear la base de datos del sistema. Tiene que haber dos: la real y una de pruebas.

### 3. Comparar skills con otros proyectos
Revisar La Pasamos Bien y App repuestos de auto para ver qué skills tienen que acá falten.

### 4. Traer seis skills
Sumar a este proyecto `migracion-supabase`, `pre-finish`, `revision-logica`,
`verificacion-funcional`, `endpoint-staff` y `tests-rls`.

### 5. Reglas de código escritas
Dejar escrito que las funciones no superen las 20 líneas (si no, refactorizar), que los
archivos no sean largos, y que los comentarios y la base de datos estén en español.

### 6. Tests reales contra la base de pruebas
Todos los tests tienen que correr contra la base de datos de pruebas, sin simularla.

### 7. Guía de estilos dentro de la aplicación
Que la aplicación tenga desde el principio una guía de estilos (colores, tipografía,
componentes) con previsualización, que toda la aplicación la use y que se actualice con
cada cambio estético.

### 8. Prueba con Playwright en el chequeo de cierre
Agregar al chequeo de cierre abrir la aplicación con Playwright y probar de verdad lo que
se hizo, tocando los botones. Recién ahí un ítem se da por hecho.

### 9. Registro de pedidos
Tener este archivo con cada pedido (título y resumen), separado en completados y pendientes.

### 10. Que todo esto sea el flujo de trabajo habitual
Que las reglas, la prueba con Playwright y el registro de pedidos se apliquen siempre, sin
tener que pedirlo cada vez.

### 11. Análisis de preparación para empezar
Analizar en detalle la propuesta y todas las skills para determinar si estamos listos para
empezar, si las buenas prácticas están definidas, si falta alguna skill y si hay que pulir
alguna.

### 12. Dejar las skills listas para comenzar
Ajustar las skills con lo definido: usar siempre superpowers, desarrollar con TDD (los
tests van antes), nada de bases simuladas ni mocks, límites de líneas a criterio de Claude,
"hecho" significa probado en local, y `revision-logica` sigue apuntando a `PROPUESTA.md`.
No se agregan skills nuevas.

### 13. Sugerir el stack
Analizar el proyecto y sugerir el stack que convenga.

### 14. Descargar y configurar Playwright, en vivo
Dejar Playwright descargado y configurado para probar la aplicación en el navegador. Las
pruebas se corren en vivo, con la ventana a la vista, para poder verlas.

### 15. Análisis en profundidad de todas las skills
Analizar en detalle absolutamente todas las skills y el proyecto: si estamos listos para
empezar a desarrollar, si las skills van de la mano o se pisan entre sí, y mejorar,
corregir o eliminar lo que haga falta.

### 16. Commitear y pushear lo de hoy
Subir al repo privado, en un commit en `main`, todo lo trabajado hoy: `CLAUDE.md`,
`PEDIDOS.md`, las seis skills y `.mcp.json`. De acá en adelante, los cambios entran por PR
con merge commit.

### 17. Dos reglas nuevas en `CLAUDE.md` y nota en `tests-rls`
Agregar a `CLAUDE.md` que todo spec y todo plan lleven las reglas que les apliquen, y que
la rama se cree antes del spec. Reponer en `tests-rls` la nota de que sus ejemplos todavía
no corrieron contra una base real.

### 18. Enumerar las skills y el `CLAUDE.md`
Listar todas las skills y lo que contiene `CLAUDE.md`.

### 19. Armado del sistema
Diseñar y armar la base del sistema para poder empezar a desarrollar los módulos. Arranca
con el diseño (brainstorming, spec y plan) mientras Santiago crea los dos proyectos de
Supabase.

### 20. Acceso por MCP a Supabase, Vercel, GitHub y Playwright
Dejar conectados por MCP los dos proyectos de Supabase, Vercel, GitHub y Playwright antes
de seguir con el armado.

### 21. Arreglos de la revisión de la base técnica
Arreglar todo lo que dejó anotado la revisión de la base técnica: tests más flojos que su
nombre, variantes que faltan en la guía, utilidades y configuración por endurecer, la
siembra que no repara cuentas, las tipografías en un formato liviano, y las tres decisiones
de diseño (acentos de Manic, tamaño táctil y contraste del foco).

### 22. Módulo de usuarios y acceso
Construir el módulo de usuarios definido en `docs/modulos/01-usuarios.md`: registro, ingreso,
espera del invitado, cambio obligado de contraseña, mi cuenta, administración de usuarios y
el mecanismo de auditoría que van a usar todos los módulos.

### 23. Sacar la guía de estilos
Por decisión de Santiago (2026-10-07): se borra la página `/admin/guia-de-estilos`, con sus
componentes y sus pruebas, y deja de ser una regla del proyecto. Los colores, las tipografías
y los componentes base que usan las pantallas quedan.

### 24. Arreglos de la revisión de usuarios
Tres arreglos que dejó la revisión de la rama de usuarios: si Supabase Auth falla al resetear
o corregir, la marca de la acción no queda viva; el `_` de la búsqueda se busca tal cual y no
como comodín; y el proxy manda al ingreso con 303, para que un POST sin sesión no se reenvíe.
Queda para Cierres de caja: que caja pueda leer su propio local, como dice el spec.

### 25. Módulo de menú digital
Construir el catálogo mínimo de productos y el menú digital definidos en
`docs/modulos/02-menu.md`: la administración en `/admin` y la página pública en `/`.

### 26. Módulo de proveedores
Construir el módulo de proveedores definido en `docs/modulos/03-proveedores.md`: lista con
búsqueda, ficha, alta, edición, desactivar y reactivar, y el botón de WhatsApp.

### 27. Módulo de gastos
Construir el módulo de gastos definido en `docs/modulos/04-gastos.md`: gastos con filtros y total,
anulación con motivo, recurrentes que se generan solos, categorías, y lo pagado en Proveedores.
### 28. Módulo de cierres de caja
Construir el módulo de cierres de caja definido en `docs/modulos/06-cierres-de-caja.md`: carga del cierre a ciegas desde el celular, mis cierres, control de cierres con lo esperado y la diferencia, tolerancia, y los gastos de caja que van a Gastos.
### 29. Pantalla de auditoría
Construir la pantalla de auditoría definida en `docs/modulos/07-auditoria.md`: lista filtrable de lo que pasó, con nombres y valores legibles, el detalle de cada cambio y el enlace al dato, y quién cargó cada gasto, proveedor y producto.
### 30. Ventas a mano y lista de ventas
Construir la parte de `docs/modulos/05-ventas.md` que no depende de Fudo: ventas cargadas a mano con varios renglones, canales, la lista de ventas con filtros y total, el detalle y la anulación. La tabla queda con la forma de una venta de Fudo. **Excepción decidida por Santiago el 2026-10-10:** el módulo dice que no se construye hasta probar la API de Fudo con credenciales; se construye ahora lo que no depende de ella. Queda sin hacer: la sincronización con Fudo, la vinculación de productos y medios, "Actualizar ahora" y lo esperado en los cierres.
### 31. Módulo de reportes
Construir el módulo de reportes definido en `docs/modulos/08-reportes.md`: ventas por período, producto y categoría, gastos por categoría y período, caja y resultado del mes, con filtro de fechas, comparación contra otro período, tabla, gráfico y total.
### 32. Playwright sin ventana
Que las pruebas de Playwright no abran la ventana del navegador mientras corren. Se puede volver a ver con `E2E_A_LA_VISTA=1`.
### 33. Módulo de inicio
Construir el inicio del admin definido en `docs/modulos/09-inicio.md`: lo que requiere acción, los números del mes contra los mismos días del mes anterior, el gráfico de los últimos 12 meses y los más vendidos, con el mismo cálculo que Reportes.
### 34. Arreglos de la revisión lógica de la primera fase
Lo que salió de revisar cada módulo: el control de cierres marca el fondo inicial que no coincide con lo que quedó el día anterior y muestra lo retirado; el efectivo de la caja deja de poder cargarse como gasto a mano o recurrente (sale por el cierre); la misma carga de un gasto mandada dos veces no lo duplica.
### 35. Sidebar y hero con la estética de Plan Reminder Pro
Cambiar la barra de arriba del panel por una sidebar, y el encabezado de cada pantalla (el hero), con la misma estética que Plan Reminder Pro (Sistema CobrarWpp), conservando los colores y la tipografía de Manteca. Armar una skill con esa estética y aplicarla.

### 36. Publicar el sistema en el dominio
Publicar el sistema en `mantecabakeryar.com`: el menú nuevo, que sale de la base, en `/` y el panel en `/admin`. El proyecto de Vercel `manteca-menu-reimagined` ya está conectado a este repo y sigue sirviendo el deploy del 2 de julio; el deploy del merge del PR #19 falló. La base real ya tiene las 6 categorías y los 35 productos de la página de julio, con los mismos nombres, precios y descripciones, y las fotos están en `public/menu/`.

### 43. El panel desde cero
Borrar todo el front del panel (`/admin`, con el login) y rehacerlo desde cero, sin tomar como referencia el diseño anterior (decisión de Santiago, 2026-10-21). Quedan la carta pública, el servidor (acciones, `src/lib`, base) y las pruebas de Playwright de funcionamiento: son la lista de lo que cada pantalla nueva tiene que volver a hacer. Se borran las pruebas que miraban el diseño viejo, la skill `estetica-panel` vieja y los specs y planes de estética. Reemplaza los pedidos 38, 39, 40 y 42.

**Estética elegida (Santiago, 2026-10-21):** la de Plan Reminder Pro, tal cual: colores, letras, piezas y movimiento, con la marca de Manteca (cuadrado verde con la medialuna y "Manteca"). Suma `framer-motion` 12.36.0, `sonner` 1.7.4 y `lenis` 1.1.20, las versiones de Plan Reminder Pro. Está entera en la skill `estetica-panel` nueva.

**Excepción (Santiago, 2026-10-21):** los colores del panel son los exactos de Plan Reminder Pro aunque no pasen el contraste AA que pide el pedido 21 (letra blanca sobre el verde, 2,6 a 1; el rojo de error, 3,6; el anillo de foco, 2,5; los grises chicos, 2,6). Las pruebas de contraste (`tests/contraste.test.ts`) siguen mirando solo la carta pública; no se extienden al panel. El panel no bloquea el zoom en el celular, a diferencia de Plan Reminder Pro (Santiago, 2026-10-22).

### 80. Responsive: lo que quedaba del recorrido
Lo que el recorrido del pedido 79 dejó visto: los demás textos de contenido que todavía se cortaban con puntos suspensivos (Más vendidos y la torta de Inicio, la lista de Proveedores, Próximos pagos y Para clasificar en Gastos, Tipos de venta y el título de las ayudas) bajan de renglón, y después se vuelve a revisar todo, en la computadora y en el celular (Santiago, 2026-11-02).

### 79. Responsive: recortes en el celular y otro recorrido completo
En el celular se ven cosas recortadas (Santiago, 2026-11-01, después del pedido 78). Recorrer otra vez absolutamente toda la aplicación, primero en la computadora y después en el celular, como en los pedidos 76 y 77, y mejorar todo lo que no se vea bien hasta que quede bien en los dos.

### 78. Celular: todo un poco más chico y más aireado
En el celular, todas las pantallas del panel un poco más chicas y con más aire entre las cosas (Santiago, 2026-11-01). Se resuelve achicando el panel del 95 % al 90 % solo en el celular, como se hizo en la computadora en el pedido 45, y dando más espacio a los costados, bajo el título, entre los bloques y entre las tarjetas. La tablet y la computadora no cambian.

### 77. Responsive: revisión visual en celular, tablet y computadora
Mirar a ojo cada pantalla y sus estados (ventanas, menú «Más», formularios con errores, listas vacías) en celular, tablet y computadora, con Admin y con Caja, compararlas con las referencias de Plan Reminder Pro y corregir lo que se vea mal, sin tocar lo que ya está bien en la computadora (Santiago, 2026-10-31).

### 76. Responsive en toda la web
Revisar en el celular y en la computadora toda la web (carta, ingreso y panel, con Admin y Caja) y corregir lo que no se vea bien o sea incómodo de usar, sin romper lo que ya está bien en la computadora. Se anotó primero como 73, que ya era «Cambiar de sección más rápido»: sus commits dicen «pedido 73».

### 75. Bases de Supabase y funciones de Vercel en São Paulo
Las dos bases (pruebas y real) están en Oregón (`us-west-2`): desde Argentina cada consulta tarda unos 250 ms, de los que Supabase procesa de 6 a 12. Se crean dos proyectos nuevos en São Paulo (`sa-east-1`), se copian con `pg_dump` la estructura, los datos, los usuarios con sus contraseñas y los trabajos programados, y al publicar las funciones de Vercel corren en São Paulo (`gru1`). Decisión de Santiago (2026-10-29).

### 74. El navegador recuerda unos segundos cada sección visitada
Volver a una sección vista hace menos de 30 segundos la muestra al instante, sin pedírsela de nuevo al servidor (`staleTimes.dynamic` de Next). Cuando alguien guarda algo, el panel entero se vuelve a pedir igual que hoy (Santiago, 2026-10-29).

### 73. Cambiar de sección más rápido: una sola tanda de consultas por pantalla
Al pasar de una sección a otra, el panel tardaba de 1,5 a 2,5 segundos: cada pantalla consultaba la base en tandas, una detrás de otra (Caja: el perfil, después cinco consultas y después los fondos anteriores), y cada tanda espera el viaje hasta la base. El control de acceso y los datos de cada pantalla salen a la vez: la base ya filtra cada consulta y quien no tiene permiso sigue yendo a su pantalla (Santiago, 2026-10-29). Diseño en `docs/superpowers/specs/2026-10-29-navegacion-rapida-design.md`, junto con el 74.

**Excepción (Santiago, 2026-10-29):** el 73 y el 74 se hacen en un worktree aparte (`../Sistema-Manteca-navegacion`, rama `fix/navegacion-rapida`), con su propio `.env.local` y su `node_modules`, porque otra sesión tenía 55 archivos sin commitear en las mismas páginas y Santiago prefirió no esperarla. Las pruebas de Playwright de las dos sesiones usan el mismo puerto (3211): no se corren a la vez.

### 72. Inicio: cartelito de la semana y aviso nuevo
En «Esta semana vs la anterior» el cartelito muestra las ventas de ese día y las ventas hasta ese día, en las dos semanas, en dos bloques simples. El gráfico de gastos por categoría deja el dorado (celeste). Las flechas de «Para atender» se ponen rojas al pasar el mouse. La ayuda de Inicio suma los botones de cada tarjeta (Santiago, 2026-10-28).

### 71. Menú: filas que abren el detalle, iconos nuevos y «Aumentar precios»
En Menú, tocar un producto o una categoría abre su edición; los iconos de cada fila (flechas juntas, ojo, lápiz azul al pasar el mouse, tacho) se rediseñan; las filas de productos pierden las líneas; «Aumento de precios» pasa a «Aumentar precios»; el aviso de Fudo aclara que todavía no hay integración. La ayuda de Menú y la de Ventas se completan (Santiago, 2026-10-28).

### 70. Usuarios: tarjetas más simples, sin «Rechazar» y con «Vos»
En Usuarios se quita el botón Rechazar (queda solo el selector de rol), las tarjetas pasan a una sola fila de acciones con altura pareja, la propia cuenta lleva la etiqueta verde «Vos», y el selector de rol pierde el borde dorado. La ayuda deja de hablar de Rechazar y de Mi cuenta (Santiago, 2026-10-28).

### 69. Panel: hover del menú lateral, aviso Próximamente y caja
Todos los botones del menú lateral y la tarjeta de sesión comparten el hover blanco con borde y sombra, y el menú se ve un 1 % más chico. El aviso Próximamente se simplifica. En Caja se invierte el orden de «Cargar cierre» y «Diferencia aceptada» (Santiago, 2026-10-28).

### 68. Gastos: pagar desde el aviso de Inicio, Pagados desplegable y Próximos pagos con plazo
Desde Inicio, «Esta semana vence 1 pago» abre Gastos con la ventana de «Pagado» de ese pago. «Pagados» pasa a un desplegable cerrado por defecto («Ver los pagados»). Cada tarjeta de categoría abre una ventana con todos sus gastos. Próximos pagos muestra por defecto los 30 días que vienen, con selector de 15 días, 30 días, 1 año o todos. El filtro de categoría dice «Filtrar por categoría» (Santiago, 2026-10-28).

### 67. Gastos: una tarjeta por categoría arriba de Pagados
Sobre la lista de Pagados se ve una tarjeta por cada categoría con gastos en el mes, con cuántos gastos tiene y cuánto suman (sin los anulados). Respeta el mes y el tipo (Todos, Fijos, De caja); tocar una tarjeta filtra la lista por esa categoría y volver a tocarla la saca (Santiago, 2026-10-28).

También (2026-10-28): cada tarjeta se abre y lista sus gastos; Próximos pagos más compacto, con un separador por mes (con lo que suma) y la etiqueta «Fijo · …» con un color por frecuencia; fecha en verde lo pagado y en rojo lo que falta pagar; «Fecha en que vence» / «Fecha de pago» al cargar; se saca el comprobante del formulario; y el gasto se puede pagar en **Efectivo** o **Cheque** (migración `20261028200000_gastos_efectivo_y_cheque.sql`, aplicada solo en pruebas).

### 66. Cierres de caja: dos estados, editables y comparados con las ventas del día
Rediseño del módulo (Santiago, 2026-10-28). Los estados pasan a ser **Cierra** y **Con diferencia**, más **Pendiente** para un día sin cierre cargado. Se saca todo lo de «Revisado» (marcar, comentario y estado). El cierre se puede **editar** (Caja el suyo, el admin cualquiera, con valor anterior y nuevo en la auditoría), y lo esperado se **calcula siempre al mostrar** contra las ventas del día, por medio de pago, con la tolerancia que se mantiene. Sigue «Anular» solo para el admin, con motivo. Cambia lo decidido el 2026-10-06 y el 2026-10-09 en `docs/modulos/06-cierres-de-caja.md` (cierre que no se edita, estado «Esperando ventas» y «Revisado»). Sin ventas el esperado es $0.

**Excepción (Santiago, 2026-10-28):** se hace en la rama `feat/caja-rediseno`; lo anterior se commiteó antes por áreas, no pedido por pedido, porque estaba mezclado en los mismos archivos y nunca se corrió `npm run verificar` completo sobre esos commits.

### 61. Control de cierres: tolerancia en una tuerca y fila que abre el detalle
En `/admin/caja/control`, la tolerancia sale de su sección y queda detrás de una tuerca de configuración que abre una ventana con el mismo campo. Cada cierre de la lista se abre al tocar cualquier parte de la fila, con una flecha que lo avisa.

### 65. Gastos: anotar lo que todavía no se pagó
Al cargar un gasto se elige si ya se pagó o si todavía no: lo que se paga en el corto plazo (una factura que vence en unos días) queda anotado como por pagar, se ve con lo que viene y, cuando se paga, se marca como pagado (Santiago, 2026-10-27). Hasta ahora "cuentas a pagar" estaba fuera de alcance (`docs/modulos/04-gastos.md`). Se anotó como 63, número que también tomó otra sesión para Ventas.

**Decidido (Santiago, 2026-10-28):** lo por pagar cuenta recién cuando se paga, en la fecha del pago; se ve en Próximos pagos con un botón "Pagado" que abre una ventana con fecha, monto y medio para confirmar o corregir; lo vencido queda arriba. Los fijos dejan de nacer pagados: el día que vencen quedan por pagar (cambia lo decidido el 2026-10-06). Pagar en partes queda afuera. Diseño en `docs/superpowers/specs/2026-10-28-gastos-por-pagar-design.md`.

**Excepción (Santiago, 2026-10-28):** se hace en la rama `feat/caja-control-detalle`, que abrió otra sesión, y no en una rama propia: varias sesiones de Claude trabajan en la misma carpeta y cambiar de rama las movería a todas.

### 62. Gastos: nueva estética de la cabecera de Pagados
La cabecera de «Pagados» (mes, tipo, categoría y total) se rediseña con las piezas de Plan Reminder Pro: mes en una píldora, control segmentado azul marino y el total como mosaico. No cambia ningún texto ni comportamiento.

### 64. Subir Excel de Fudo más realista y filtros más descriptivos
La pantalla de subida pasa a una zona de arrastre con pasos y tarjeta del archivo elegido (con su tamaño y un botón para quitarlo). Los filtros de Control de cierres y de Auditoría dicen «Todos los empleados», «Todos los estados», «Todos los módulos» y «Todas las acciones» en vez de «Todos»/«Todas».

### 63. Ventas: botones de arriba y «Tipos de venta»
En Ventas, «Cargar venta» pasa a la píldora blanca, «Subir Excel de Fudo» a verde y «Canales» se llama «Tipos de venta» en todo lo que se ve (botón, pantallas, formulario, avisos, ayuda y auditoría). Los nombres internos y la URL no cambian.

### 60. Ventas: tarjetas de resumen y una tabla más clara
En Ventas, el resumen de arriba ("Cobrado: … en N ventas") pasa a tarjetas de estadísticas rápidas (cobrado, ticket promedio, canceladas y anuladas). La tabla muestra siempre el estado con una insignia, la hora de la venta cuando se conoce, el canal debajo del origen (sin columna propia), íconos en el origen y el medio de pago, y cada fila se abre con un clic. El detalle de la venta suma la hora, los íconos y, para las del Excel de Fudo, avisa que vienen sin productos. Las ventas del Excel dejan de llevar una hora inventada (Santiago, 2026-10-27).

### 59. Importar las ventas de Fudo desde el Excel
En Ventas, poder importar las ventas de Fudo desde su Excel (Santiago, 2026-10-27). Hoy `CLAUDE.md`, `docs/producto.md` y `docs/modulos/05-ventas.md` lo dejan afuera: las ventas entran por la API de Fudo, que espera las credenciales, y el Excel "Reporte de ventas" trae totales por día y por medio de pago, sin productos ni tickets. Hacerlo es una excepción que decide Santiago conociendo eso.

**Excepción decidida (Santiago, 2026-10-27):** mientras no esté la API, se sube el "Reporte-Ventas" desde Ventas, con vista previa antes de guardar. Se usa la hoja de medios de pago: cada día y medio entra como tantas ventas de origen Fudo como diga el Excel, de partes iguales (el resto en la primera), sin productos. Subir otra vez el mismo período no duplica: actualiza lo de ese día y medio y anula las que sobren. Sin productos, "Más vendidos" y ventas por producto no reflejan estas ventas. Queda sin hacer la API de Fudo.

### 58. Gastos desde cero, más simple
Rediseño estético y estructural de toda la sección Gastos, con todo dentro de Gastos (Santiago, 2026-10-27). No se entiende cuáles gastos se repiten y cuáles no, no se ven separados los ya pagados de los que vienen, el apartado de recurrentes no es claro, y el campo y la columna Proveedor aparecen siempre aunque la categoría no lo pida. Incluye lo pedido antes en la misma sesión: sacar el filtro de proveedor y que los filtros se apliquen solos, sin el botón "Filtrar".

**Excepción (Santiago, 2026-10-27):** se hace en la rama `feat/mes-a-mes-aireado`, junto con lo que está en curso (pedidos 52 a 57 y cambios de Usuarios sin registrar), y no en una rama propia: hay otras sesiones de Claude trabajando en la misma carpeta, y cambiar de rama las movería a todas.

### 57. Un solo botón «Nuevo» en el Menú
En el encabezado del Menú, "Nueva categoría" y "Nuevo producto" pasan a un solo botón Nuevo que abre dos opciones: Categoría ("Para agrupar productos") y Producto ("Con sus precios"). Quedan dos botones en vez de tres (Santiago, 2026-10-27, idea 13).

### 56. "Cómo funciona" completo en todos los módulos
La ayuda de cada pantalla (el botón ⓘ) se completa como la de Inicio: cada dato, cada filtro, cada estado y cada acción explicados, a partir de lo que la pantalla hace hoy. Se corrigen los atajos de Reportes (decía "esta semana") y Ventas avisa que Fudo todavía no está conectado (2026-10-27).

### 55. Editar categoría con nombres que se entienden
En el formulario de categoría del menú, "Presentaciones" pasa a "Cómo se vende" y cada forma de venta lleva su nombre ("Se vende por") y su precio en una sola línea. La casilla "Precio compartido" pasa a "Mismo precio para todos los productos", con una frase que explica qué hace, y en la tabla del aumento el renglón de la categoría dice "Facturas · precio para todos". Santiago no entendía la pantalla (2026-10-27).

### 54. Ingreso y registro con otra estética
La tarjeta de ingreso y la de registro siguen la imagen que pasó Santiago, con los colores de Manteca: título con la última palabra en dorado y subtítulo, campos sin etiqueta a la vista con su ícono, ojito en la contraseña, botón principal con degradé dorado, "¿Olvidaste tu contraseña?" (avisa que la resetea el administrador) y "Crear cuenta" / "Ya tengo cuenta" como botón secundario. Sin flecha para volver. El lema "Sistema de gestión" queda pegado al logo (Santiago, 2026-10-27).

### 53. Pantalla de carga al cambiar de sección
Al tocar otra sección del panel, la pantalla quedaba quieta 1,5 a 2 segundos hasta que llegaban los datos. `loading.tsx` en el panel muestra enseguida un esqueleto y deja que Next precargue cada sección (Santiago, 2026-10-27).

### 52. Mes a mes más aireado
El gráfico mes a mes con el eje en montos cortos ("$20 M"), la ventanita del mouse más chica y prolija, la franja de fondo más suave y más aire en la leyenda (Santiago, 2026-10-27).

**Excepción (Santiago, 2026-10-27):** los pedidos 47 a 51 entraron a `main` sin `npm run verificar` ni `npm run e2e` completos; solo lint, tipos y los 540 tests puros en verde. Del 50 entraron los cálculos y la consulta, pero no la pantalla: otra sesión sacó `Ayer.tsx`, `Vencimientos.tsx` y sus pruebas de Playwright. Falta el cierre completo de los cinco.

### 51. `npm run local`: la aplicación armada entera, sin compilar al navegar
En local, `next dev` compila cada sección la primera vez que se entra y se siente lento. `npm run local` arma todo con `next build` en `.next-local` y lo sirve con `next start` en el 3210, contra la base de pruebas: navega como en producción, pero no recarga solo (Santiago, 2026-10-27).

### 50. Inicio: ayer en una línea y vencimientos de la semana
Arriba de todo, una franja con lo de ayer: ventas, tickets, ticket promedio y el cierre (cargado, con diferencia de $X, que lleva al control de ese día, o sin cargar). Si ayer no hubo ventas dice "Ayer no hubo ventas" y no sale el aviso de cierre faltante. Una tarjeta con los gastos recurrentes activos que vencen en los próximos 7 días, contando hoy, con su total; si no hay, no aparece (Santiago, 2026-10-27). Se hace en la rama `feat/panel-crema`, junto con el 47 y el 48, por decisión de Santiago: tocan los mismos archivos de Inicio.

### 49. Inicio: el mes en curso marcado y "Más vendidos" por plata
En el gráfico mes a mes, el mes de hoy se marca "en curso" y sus barras van más claras: va del 1 a hoy y no se tiene que leer como una caída. "Más vendidos" aclara en la tarjeta que se ordena por lo que dejó cada producto, no por unidades (Santiago, 2026-10-27).

### 48. Proveedores, Reportes, Auditoría y Mi cuenta: "Próximamente"
En la barra lateral y en el menú "Más" del celular, esas cuatro secciones no dejan entrar: al tocarlas aparece un aviso "Próximamente" y la pantalla no cambia (Santiago, 2026-10-27). Solo bloquea el toque en la navegación; entrar escribiendo la dirección sigue funcionando.

### 47. Inicio: gastos por categoría en torta, y variación con color
En Inicio, un gráfico de torta con los gastos del mes por categoría (las cinco mayores, el resto en "Otras"), a la par de "Esta semana vs la anterior". Y la variación de cada tarjeta de números va en verde si mejora y en rojo si empeora, con una flecha (en Gastos, bajar es mejorar) (Santiago, 2026-10-27).

### 46. Actualizar Next.js por seguridad
Next.js 16.4.0 tiene una vulnerabilidad publicada y `next dev` se frenaba al arrancar para avisarlo. Pasa a 16.4.3, con `eslint-config-next` igual, fijadas exactas (Santiago, 2026-10-25, en la rama del pedido 45).

### 45. El panel en azul marino
El panel (`/admin`) deja el verde de marca de Plan Reminder Pro y pasa a un azul marino corporativo, `#1e3a8a`, con letra blanca (botones principales, sección activa, foco, marca y la serie de ventas en los gráficos; resultado pasa a ámbar). Los fondos de cada pantalla quedan como antes, y se mantienen las letras, las piezas y el movimiento de Plan Reminder Pro. El verde `emerald` queda solo para lo que confirma plata o exporta. Primero se probó el dorado de Manteca Bakery sobre crema; Santiago pidió volver a los fondos de antes y después cambiar al azul (2026-10-25).

### 44. Barra lateral en grupos y más chica
La barra lateral del panel agrupa las secciones: Día a día (Inicio, Ventas, Caja), Plata (Gastos, Proveedores, Reportes) y Ajustes (Menú, Usuarios, Auditoría), con Mi cuenta fija abajo, fuera de los grupos. Todo a escala 0,9: ancho 234 px, íconos, letra y espacios (Santiago, 2026-10-23). Caja ve su lista sin grupos.

### 41. Playwright en otro puerto
Que las pruebas de Playwright levanten su servidor en el puerto 3211, con su propia carpeta de compilación, para no tumbar el `npm run dev` del 3210 (pedido de Santiago, 2026-10-21).

### 40. Sidebar elegida y vuelta a la paleta de Manteca
Santiago eligió el 2026-10-21, entre 20 propuestas, la sidebar con las secciones en tres grupos ("Día a día", "Plata", "Ajustes"), el número de pendientes en Caja, Gastos y Usuarios, la sección activa marcada con una pestaña dorada al costado, el logo de Manteca arriba y Mi cuenta al pie. Decidió también que todo el panel vuelva al crema, el dorado y el marrón con Neufile Grotesk: se saca la paleta índigo y las tipografías Inter y Outfit del pedido 39.

### 39. Rediseño de Inicio y de la sidebar
Rediseño completo, desde cero, de la estética de Inicio (admin) y de la sidebar, con colores y estilo moderno a criterio de Claude (pedido de Santiago, 2026-10-21): sidebar oscura flotante, Inicio en bloques tipo bento, acento índigo. Los colores valen solo dentro del panel, el menú público no cambia. Sin cambios en qué hace cada pantalla.

### 42. Colores y letra de Plan Reminder Pro en el panel
El panel (`/admin`) usa los colores exactos y las tipografías (Inter y Outfit) de plan-reminder-pro, aplicados solo dentro de `.escala-del-panel`: el menú público sigue con el crema, el dorado y la letra de Manteca. Excepción a "colores y tipografía de Manteca" (CLAUDE.md, skill `estetica-panel`) por decisión de Santiago (2026-10-21); deshace la vuelta a Manteca del pedido 40. Falta actualizar CLAUDE.md y la skill, y los colores fijos que quedaron en Inicio (rojo de Para atender, dorado en los textos).

### 38. Estética de Plan Reminder Pro en Inicio, Menú y Ventas
Llevar al cuerpo de Inicio, Menú y Ventas la estética de FiestaCobra (tarjetas con ícono, bloque oscuro de "Ventas del mes", paneles con cabecera, tabla, filtros en tarjeta, acciones como íconos), con los colores y la tipografía de Manteca. Diseño en `docs/superpowers/specs/2026-10-19-estetica-de-pantallas-design.md`.

**Excepción (Santiago, 2026-10-20):** Inicio lleva tarjetas blancas con letra negra, subtítulos grises y acentos verde, rojo y azul (no solo los colores de `globals.css`). La paleta pasa a la de la referencia de Santiago (los tokens HSL de `plan-reminder-pro`: fondo `210 20% 98%`, texto `220 40% 12%`, subtítulos `220 20% 45%`, bordes `220 20% 90%`) en toda la app, y las tarjetas de Inicio llevan borde y ícono verde, rojo y azul sobre blanco, con el bloque en azul marino. Quedó sin hacer: aplicar lo mismo a Menú y Ventas.

### 37. Ícono de la pestaña
La pestaña del navegador no muestra ningún ícono. Va la medialuna 🥐, como en la página de julio (decisión de Santiago, 2026-10-19).

## Pendientes

| # | Pedido | Qué falta |
|---|---|---|
| 80 | Responsive: lo que quedaba del recorrido | Hechos los arreglos con su prueba (`e2e/recortes.spec.ts`). Falta: el check de cierre y el recorrido completo de después |
| 75 | Bases de Supabase y funciones de Vercel en São Paulo | Postergado por Santiago (2026-10-29): se hace otro día. Ya relevado: Supabase no cambia la región de un proyecto existente; se crea uno nuevo eligiendo la región específica «South America (São Paulo)», no la general «Americas», que deja elegir a Supabase. Hay que respetar el límite de dos proyectos gratis: copia completa de las dos bases con `pg_dump` (instalado en la máquina), pausar la real vieja, crear y restaurar primero la de pruebas, y después la real. Ninguna base tiene fotos en Storage; la real tiene el menú (6 categorías y 35 productos), 1 usuario y la auditoría. El 2026-10-30 las dos bases ya estaban en proyectos nuevos (`dfyresrfvawslsferjgg` y `jmtwopfgbvgmutinftcb`; no se comprobó la región): al pasarlas faltaron los disparadores de `auth.users`, la policy de fotos y la confirmación de email apagada, y se restauraron (pedido 76) |
| 72 | Inicio: cartelito de la semana y aviso nuevo | Todo |
| 71 | Menú: filas que abren el detalle, iconos nuevos y «Aumentar precios» | Todo |
| 70 | Usuarios: tarjetas más simples, sin «Rechazar» y con «Vos» | Todo |
| 69 | Panel: hover del menú lateral, aviso Próximamente y caja | Todo |
| 68 | Gastos: pagar desde el aviso de Inicio, Pagados desplegable y Próximos pagos con plazo | Hecho con TDD en lo puro (643 tests en verde, lint y tipos); falta correr Playwright de Gastos (se cortó por tiempo) y arreglar lo que rompa por el desplegable |
| 67 | Gastos: una tarjeta por categoría arriba de Pagados | Todo |
| 66 | Cierres de caja: dos estados, editables y comparados con las ventas del día | Hecho con TDD (2026-10-28): migración `20261028190000_cierres_rediseno.sql` aplicada solo en pruebas (por `execute_sql`: `apply_migration` rechazaba con «Invalid or expired requestState»; no figura en el historial de migraciones) y reversa sin probar. Lint, tipos, build y 671 tests puros en verde; base: reglas, RLS y servicios en verde salvo 3 de Ventas por el canal «Cheaf» duplicado (no es de este pedido). Playwright de Caja en computadora: 16 en verde y falla `caja.spec` «no ve los cierres de otros» (404 que llega 200, anterior). En celular fallan `caja-control` «ve el cierre…» y «toda la fila abre su detalle» (sin investigar) y ese mismo 404. Falta: arreglar esos dos de celular, `npm run e2e` entero en los dos tamaños, capturas contra `referencias/`, OK de Santiago para la base real y probar la reversa |
| 65 | Gastos: anotar lo que todavía no se pagó | Hecho con TDD (2026-10-28): diseño y plan en `docs/superpowers/`, migraciones `20261028150000_gastos_por_pagar.sql` y `20261028170000_generar_por_pagar.sql` aplicadas y verificadas solo en pruebas (columnas, grants, policies y avisos de Supabase sin nada nuevo). Tests de base de Gastos (113, con RLS de lo por pagar), puros de Gastos, ayudas y auditoría, y Playwright de Gastos en computadora y celular (`gastos-por-pagar`, `gastos`, `gastos-carga`, `gastos-fijos`, `gastos-categorias`: 37 en celular) en verde. Suite completa de Vitest: 1164 en verde; fallaron 4 de Ventas por trabajo de otra sesión (falta el canal "Cheaf") y 2 de `revision-fase-1`, regresión del 58 ya corregida. Además, los tests generaban los fijos de toda la base con fechas lejanas: ahora generan solo el suyo, y se limpiaron 305 pagos y 174 por pagar falsos de los gastos de muestra. Falta: OK de Santiago para aplicar a la base real `20261027210000`, `20261028150000`, `20261028160000` y `20261028170000`; probar las reversas (la herramienta de Supabase rechaza los `DROP` con "Invalid or expired requestState"); y el cierre completo (`npm run verificar` frena en el lint de `src/lib/inicio/numeros.ts`, de otra sesión, y `npm run e2e` entero) |
| 64 | Subir Excel de Fudo más realista y filtros más descriptivos | Todo |
| 63 | Ventas: botones de arriba y «Tipos de venta» | Todo |
| 62 | Gastos: nueva estética de la cabecera de Pagados | Todo |
| 61 | Control de cierres: tolerancia en una tuerca y fila que abre el detalle | Todo |
| 60 | Ventas: tarjetas de resumen y una tabla más clara | Todo |
| 59 | Importar las ventas de Fudo desde el Excel | Hecho con TDD (2026-10-27): lector del Excel y reparto en partes iguales (`excelDeFudo.test.ts`, `leerExcelDeFudo.test.ts`, `mensajesDeLaSubida.test.ts`), función de la base `ventas_importar_excel` aplicada solo en pruebas (`tests/reglas/ventas-excel.base.test.ts`, 19 casos), servicio (`tests/servicios/ventas-excel.base.test.ts`) y pantalla `/admin/ventas/subir` (`e2e/ventas-excel.spec.ts`, 9 en verde en computadora y celular). Falta: OK de Santiago para aplicar la migración `20261028120000_ventas_excel_de_fudo.sql` a la base real, actualizar `docs/producto.md` y `docs/modulos/05-ventas.md`, `schema.sql`, y el cierre completo |
| 58 | Gastos desde cero, más simple | Hecho con TDD (2026-10-27): diseño en `docs/superpowers/specs/2026-10-27-gastos-desde-cero-design.md`, migración `20261027210000_gastos_fijos.sql` aplicada y verificada solo en pruebas (reversa probada), tests de base de Gastos (69), puros (596) y Playwright de Gastos en computadora y celular (58: `gastos`, `gastos-carga`, `gastos-categorias`, `gastos-fijos`) en verde, más `caja-control` (clasificar), `inicio-admin` (aviso) y `proveedores` (aviso) en computadora; tipos y lint de lo tocado limpios. Falta: OK de Santiago para aplicar la migración a la base real y el cierre completo (`npm run verificar` y `npm run e2e` enteros), que hoy no da verde por trabajo en curso de otras sesiones (gráficos de Inicio, fila del control de Caja, largo de `numerosDelMes`). El 2026-10-28 la suite completa mostró que esa migración había perdido la regla de que un fijo no use el efectivo de la caja (`tests/reglas/revision-fase-1`): la repone `20261028160000_fijos_sin_efectivo_de_caja.sql`, aplicada solo en pruebas, que va a la real junto con esta |
| 57 | Un solo botón «Nuevo» en el Menú | Hecho con TDD: `e2e/menu-nuevo.spec.ts` falló con los tres botones y pasó con Nuevo, en computadora; lint y tipos limpios (2026-10-27). Falta el cierre completo |
| 56 | "Cómo funciona" completo en todos los módulos | Hecho con TDD: `src/lib/panel/ayudas.test.ts` falló en las 14 ayudas y en los atajos de Reportes, y pasó después (19 en verde); lint y tipos limpios (2026-10-27). Falta el cierre completo (`npm run verificar` y `npm run e2e`) |
| 55 | Editar categoría con nombres que se entienden | Hecho con TDD: `src/lib/menu/esquemas.test.ts`, `e2e/menu-formularios.spec.ts` y `e2e/menu-aumento.spec.ts` fallaron con los nombres viejos y pasan con los nuevos, en computadora (2026-10-27); en celular, todo menos "se lee simple", que se cortó por el 3211 y se comprobó con un script contra el 3210. Tipos, lint y formato de lo tocado limpios. Falta el cierre completo. "una categoria que no existe da 404" da 200 por el `loading.tsx` del 53, no por este |
| 54 | Ingreso y registro con otra estética | Hecho con TDD: `e2e/ingreso-estetica.spec.ts` y `e2e/acceso.spec.ts` en verde en computadora y celular (2026-10-27). Falta el cierre completo |
| 53 | Pantalla de carga al cambiar de sección | Hecho con TDD: `e2e/carga.spec.ts` falla sin `loading.tsx` y pasa con él, en computadora (2026-10-27). Falta el cierre completo |
| 51 | `npm run local`: la aplicación armada entera | Probado el 2026-10-27 en el 3212 (el 3210 estaba con `npm run dev`): arma y sirve, `/` en 1,1 s y el ingreso en 0,18 s. Falta que Santiago lo use con sesión y confirme que las secciones van rápido; entra al repo con el commit de la rama |
| 50 | Inicio: ayer en una línea y vencimientos de la semana | Hecho con TDD: tests puros (`ayer`, `vencimientos`), de base (`inicio.base.test.ts`) y sus dos pruebas de Playwright en computadora, en verde; lint de lo tocado y tipos limpios (2026-10-27). Falta el cierre completo (`npm run verificar` y `npm run e2e` en los dos tamaños), junto con el 47 y el 48 |
| 49 | Inicio: el mes en curso marcado y "Más vendidos" por plata | Todo |
| 48 | Proveedores, Reportes, Auditoría y Mi cuenta: "Próximamente" | Todo |
| 46 | Actualizar Next.js por seguridad | Hecho: tipos, lint y build en verde y `next dev` arranca sin el aviso. Falta el cierre completo, junto con el 45 |
| 45 | El panel con la paleta de Manteca | Hechos el dorado (se deshizo el azul marino), los colores de Inicio (avisos en rosa, gráficos y Balance), las medallas, el nuevo orden de Inicio, el logo de Manteca, la barra lateral y los títulos más compactos y el panel al 95 %. **Excepción (Santiago, 2026-10-26):** entró a `main` sin `npm run verificar` ni `npm run e2e`; solo lint, tipos y tests puros en verde. Las pruebas nuevas de `e2e/sidebar.spec.ts` y `e2e/inicio-admin.spec.ts` se vieron fallar antes del cambio, pero no pasar después. `CLAUDE.md` y `estetica-panel` todavía dicen "azul marino". Falta el cierre completo |
| 44 | Barra lateral en grupos y más chica | Hecha y probada con lint, tipos, tests de `acceso` y `sidebar` en computadora (2026-10-23). Falta el cierre completo (`npm run verificar` y `npm run e2e` en los dos tamaños) |
| 43 | El panel desde cero | Hechas las pantallas (2026-10-22): ingreso, registro, Inicio, Mi cuenta, Proveedores, Gastos (con categorías y recurrentes), Ventas y canales, Caja (cargar, mis cierres, control, detalle), Menú (lista, categorías, productos, aumento y desactivados), Reportes, Usuarios y Auditoría, cada una con su ayuda y probada en computadora y celular. Falta el cierre: `npm run verificar` entero, `npm run e2e` entero y revisar las capturas contra `referencias/` |
| 42 | Colores y letra de Plan Reminder Pro en el panel | Reemplazado por el pedido 43: el panel se rehace desde cero |
| 38 | Estética de Plan Reminder Pro en Inicio, Menú y Ventas | Reemplazado por el pedido 43: el panel se rehace desde cero |
| 41 | Playwright en otro puerto | Todo |
| 40 | Sidebar elegida y vuelta a la paleta de Manteca | Reemplazado por el pedido 43: el panel se rehace desde cero |
| 39 | Rediseño de Inicio y de la sidebar | Reemplazado por el pedido 43: el panel se rehace desde cero |
| 37 | Ícono de la pestaña | Hecho con su prueba en `src/app/icon.svg`. Falta que `npm run verificar` y `npm run e2e` den verde enteros: en la primera corrida dos archivos de tests de base se cortaron por tiempo y la segunda se frenó por falta de memoria |
| 36 | Publicar el sistema en el dominio | Cargar en Vercel las variables de la base real, volver a publicar, crear la cuenta del dueño en la base real y comprobar `/` y `/admin` en el dominio |
| 30 | Ventas: la parte de Fudo | Construida la parte a mano (ver Completados). Falta, cuando estén las credenciales: traer las ventas de Fudo, vincular productos y medios, "Actualizar ahora" y lo esperado en los cierres. En Reportes: mostrar hasta cuándo están sincronizadas las ventas, y resolver los descuentos de Fudo para que "por producto" cierre con "por período". En Inicio: los avisos "Productos de Fudo sin vincular" y "Las ventas no se sincronizan desde hace más de un día", y la fecha de la última sincronización |
| 21 | Arreglos de la revisión de la base técnica | Hecho y verificado (rama `fix/revision-base-tecnica`): montos sin precisión y URL sin cifrar se rechazan; protecciones de configuración (todo test corre en algún grupo, versión de Node, tipos de Supabase fuera de Prettier, clave secreta prohibida en componentes); la siembra repara cuentas y lee todas las páginas; un solo aviso con todas las variables que faltan; comprobación de tokens corregida; colores con contraste suficiente y anillo de foco entero. Los controles de 44 px, el campo con error y los títulos en Neufile Grotesk entraron con el pedido 22. Queda para el menú público: las tipografías en woff2. Las variantes de la guía ya no van: la guía se sacó en el pedido 23 |

## Completados

Los pedidos sin código de aplicación no tuvieron tests ni Playwright que correr: se anota
cómo se verificó cada uno.

| # | Pedido | Fecha | Cómo se verificó |
|---|---|---|---|
| 79 | Responsive: recortes en el celular y otro recorrido completo | 2026-11-01 | Recorridas a ojo y medidas las 59 pantallas (con Admin, Caja y sin sesión, y Ventas, Gastos, Control y Reportes también con los datos de octubre) en la computadora (1440, con medidas en 1920, 1366 y 1024) y en el celular (390 y 360, y 390 en WebKit), más las ventanas, el menú «Más» y los desplegables en 360. Lo que se cortaba estaba casi todo en el celular angosto: las tablas de Reportes perdían la última columna (Diferencia, Variación, Ticket), los ejes de los gráficos cortaban su último número (también en la computadora), las variaciones se partían dentro del paréntesis («(-100» y «%)»), Gastos, Proveedores y Usuarios cortaban nombres, detalles y emails con puntos suspensivos, y el botón «Sumar» de Tipos de venta tapaba el ejemplo del campo. Además, el gráfico de Caja mostraba solo los primeros diez días. Todo arreglado con su prueba antes (`e2e/recortes.spec.ts`, en 360 y en la computadora, con montos de millones sembrados, y `comparacion.test.ts`); la regla quedó en la skill `estetica-panel`. Después, a 360 y 390 no queda nada cortado ni con puntos suspensivos, y a 1440 tampoco. `npm run verificar` (lint, tipos, 727 tests puros, 539 de base y build) y `npm run e2e` entero (los 34 archivos, en computadora y en celular) en verde, por partes y en primer plano. En el camino, `borrarVentas` de las pruebas dejaba la auditoría de los renglones y los pagos: arreglado con su test. Con el OK de Santiago se borraron de la base de pruebas las 872 filas de auditoría huérfanas que habían dejado pruebas anteriores (renglones y pagos de ventas ya borradas, de prueba.admin o sin usuario). Visto y sin tocar: `/admin/costos` escrito a mano da el 404 de Next (la sección es «Próximamente»); los botones de 44 px miden 40 en pantalla por el achique al 90 % del pedido 78 |
| 78 | Celular: todo un poco más chico y más aireado | 2026-11-01 | En el celular (hasta 639 px) el panel pasa del 95 % al 90 %, con 20 px a los costados, 36 bajo el título, 32 entre bloques y 16 entre tarjetas; la tablet y la computadora quedan igual. Probado en `e2e/responsive.spec.ts` (falló antes del cambio) y con guardas en `e2e/responsive-tablet.spec.ts` para tablet y computadora. Capturas de antes y después revisadas en 390 px, sin scroll de costado ni controles cortados en 360 y 390. `npm run verificar` (lint, tipos, 726 tests puros, 538 de base y build) y `npm run e2e` entero (los 33 archivos, en computadora y en celular) en verde, por partes. En el camino se arreglaron pruebas que fallaban por otras razones: las que dependían de que el mes en curso tuviera datos (el día 1 no los tenía), las que escribían antes de que React tomara la página y la limpieza de la subida del Excel, que se cortaba por tiempo; una del control de cierres falló una vez y pasó 4 de 4 al repetirla |
| 77 | Responsive: revisión visual en celular, tablet y computadora | 2026-10-31 | Revisadas a ojo las 46 pantallas en 390, 768, 1024 y 1440 px (las medidas, también en 360), con Admin, Caja y sin sesión, más las ventanas, el menú «Más» y los desplegables en tablet. Arreglado, cada cosa con su prueba que falló antes (`e2e/responsive-tablet.spec.ts` y `e2e/responsive.spec.ts`): los botones de arriba que se cortaban en el celular (en Ventas, «Tipos de venta» quedaba fuera de alcance), los controles chicos al tacto en cualquier pantalla táctil con `pointer-coarse` sin cambiar la computadora con mouse, «Hoy» y «Ayer» que desde el pedido 76 quedaban más bajos que el campo de fecha, filtros de a dos en tablet y cuentas en dos columnas. Las pruebas que elegían de una lista antes de que React tomara la página ahora esperan la hidratación: Gastos fallaba 2 de 4 veces en el celular. `npm run verificar` (lint, tipos, 726 tests puros, 538 de base y build) y `npm run e2e` entero (los 33 archivos, en computadora y en celular) en verde, por partes y en primer plano. Capturas del después revisadas. Visto y sin arreglar: lo que una persona elige de una lista antes de que la página termine de cargar también se pierde (en un celular lento). Falta mirarlo en un iPhone real |
| 76 | Responsive en toda la web | 2026-10-30 | `npm run verificar` y `npm run e2e` en verde, corridos por partes en primer plano por falta de memoria: lint, tipos, build, los tests puros, 532 de base, y los 31 archivos de Playwright en computadora y en celular. Barrido de las 47 pantallas sin scroll lateral en 360, 390, 430, 768 y 1440 px, y superposiciones probadas en Chromium y WebKit antes de los últimos arreglos. Capturas: revisadas las principales, no todas. En la base de pruebas se restauraron los disparadores de `auth.users` y la policy de fotos, que no pasaron al proyecto nuevo; Santiago apagó la confirmación de email. Falta mirarlo en un iPhone real: en el WebKit de Windows la letra se ve fina. El mismo día, con el OK de Santiago, se restauraron en la base real los dos disparadores y la policy de fotos, verificados con una consulta y sin avisos nuevos de Supabase; Santiago apagó ahí la confirmación de email el 2026-10-31, comprobado en la configuración de Auth. El 2026-10-31, después de mergear `fix/navegacion-rapida`, otra vez en verde: `npm run verificar` (lint, tipos, 726 tests puros, 538 de base y build) y `npm run e2e` entero (los 32 archivos, en computadora y en celular) en verde, por partes y en primer plano |
| 74 | El navegador recuerda unos segundos cada sección visitada | 2026-10-31 | Entró a `main` con el merge de `fix/navegacion-rapida` en la rama del pedido 76: `npm run verificar` (lint, tipos, 726 tests puros, 538 de base y build) y `npm run e2e` entero (los 32 archivos, en computadora y en celular) en verde, por partes y en primer plano. Con `npm run local`, volver a Caja dentro de los 30 segundos tarda 0,23 s |
| 73 | Cambiar de sección más rápido: una sola tanda de consultas por pantalla | 2026-10-31 | Verificado igual que el 74. Medido de nuevo con `npm run local` (sesión de admin, la página recién cargada, cinco vueltas): Inicio → Caja de 1,09 a 1,51 s y Caja → Inicio de 0,97 a 1,03 s; el 2026-10-29 era de 0,9 a 1,5 s. Se midió con otro script y contra los proyectos nuevos de Supabase, así que no se compara exacto: la primera visita no mejoró de forma clara |
| 52 | Mes a mes más aireado | 2026-10-30 | Eje corto y ventanita conectados en `GraficoPorMes`, con `e2e/inicio-montos.spec.ts` en verde en los dos tamaños; entra en el cierre del pedido 76 |
| 47 | Inicio: gastos por categoría en torta, y variación con color | 2026-10-30 | Variación en verde o rojo con flecha en `TarjetasDelMes`, con `flechaDeVariacion` probada y `e2e/inicio-admin.spec.ts` en verde en los dos tamaños; entra en el cierre del pedido 76 |
| 22 | Módulo de usuarios y acceso | 2026-10-07 | `npm run verificar` en verde (lint, tipos, 335 tests de Vitest y build) y `npm run e2e` en verde (39 pruebas en computadora y 39 en celular, con las sesiones). Migraciones aplicadas y verificadas en la base de pruebas, y el 2026-10-08, con el OK de Santiago, en la real: grants, policies y RLS iguales a pruebas, el local Manteca creado, sin cuentas todavía (la primera que se registre queda como admin) y `list_migrations` con las mismas tres en las dos bases. Capturas revisadas en los dos tamaños. La revisión independiente de la rama queda pendiente: se cortó por el límite de uso. Tras el arreglo de reactivar y sus tests, el cierre se volvió a correr el mismo día: `npm run verificar` en verde (346 tests) y `npm run e2e` en verde (75 pruebas) |
| 26 | Módulo de proveedores | 2026-10-08 | `npm run verificar` en verde (lint, tipos, 550 tests de Vitest y build) y `npm run e2e` en verde (78 pruebas en computadora y 78 en celular, con las sesiones). Migración aplicada y verificada en la base de pruebas y, el 2026-10-08 con el OK de Santiago, en la real (RLS, 3 policies y permisos por columna sin el local). Capturas de la lista y la ficha revisadas en los dos tamaños. Revisión independiente hecha: se arreglaron con su test el aviso de nombre repetido (Volver y Cargar igual), el teléfono con +54 y el 15, la búsqueda con comas, el asterisco en el nombre y el id inválido en la URL. Lo pagado al proveedor (lista, ficha y aviso de recurrente) entra con Gastos |
| 27 | Módulo de gastos | 2026-10-08 | `npm run verificar` en verde (lint, tipos, 640 tests de Vitest y build) y `npm run e2e` en verde (96 pruebas en computadora y 96 en celular, con las sesiones). Cuatro migraciones (tablas y reglas, generación con pg_cron, totales y reactivar) aplicadas y verificadas en la base de pruebas; la reversa de la primera se probó en una transacción. El 2026-10-09, con el OK de Santiago, aplicadas y verificadas en la real: 8 categorías, 9 policies, el job de pg_cron activo y nada para anon; `list_migrations` igual en las dos bases. Capturas de lista, carga, recurrentes, categorías y ficha de proveedor revisadas en los dos tamaños. Revisión de la rama: autorrevisión, sin revisor independiente. Fuera del plan, con su test: un recurrente reactivado genera desde ese día y lo generado se marca "Automático". Queda para Cierres el aviso de gastos sin clasificar. Menor diferido: un recurrente sin descripción muestra la categoría dos veces |
| 28 | Módulo de cierres de caja | 2026-10-09 | Lint, tipos, los 75 archivos de test (711 tests) y build en verde, corridos por partes: `npm run verificar` entero se colgó en Vitest con la máquina en 2,2 GB libres. `npm run e2e` en celular: 109 de 109. En computadora: 107 de 109 en la corrida completa; las dos que fallaron (la ventana del navegador se cerró en una; la otra cargó pasados los 5 segundos de espera) pasaron al volver a correr sus archivos, 23 de 23. Dos migraciones (cierres y el permiso de Caja sobre sus gastos de caja) aplicadas y verificadas en la base de pruebas; la reversa de la primera se probó en una transacción. El 2026-10-09, con el OK de Santiago, aplicadas y verificadas en la real (3 tablas, 5 policies, tolerancia en $500, nada para anon, 18 migraciones en las dos bases); hizo falta reautorizar la conexión de Supabase. Capturas de carga, control y detalle revisadas en los dos tamaños. Revisión de la rama: autorrevisión. Queda para Ventas: lo esperado, la diferencia, los estados Cierra y Con diferencia y el recálculo; hasta entonces todo cierre queda Esperando ventas. Queda para Inicio: el aviso de días sin cierre |
| 29 | Pantalla de auditoría | 2026-10-09 | Lint, tipos, los 78 archivos de test (739 tests) y build en verde, corridos por partes. `npm run e2e` por partes en primer plano (la corrida completa se cortó por falta de memoria): celular en verde entero; computadora en verde salvo el test del detalle de la auditoría, que tardaba más de 5 s en cargar con la máquina en 1,9 GB libres: se le puso una espera explícita y pasó 17 de 17 repitiendo el archivo. Sin migraciones. Capturas de la lista y el detalle revisadas en los dos tamaños. Hecho con superpowers paso a paso y revisión independiente: sus dos hallazgos importantes (el precio cambiado no llevaba a su producto; el registro no decía cuál dato era) se arreglaron con su test. Quedan anotados siete menores; entre ellos, que un alta muestra también los campos vacíos y que el motivo de una anulación se ve dos veces en el detalle |
| 30 | Ventas a mano y lista de ventas | 2026-10-11 | Por excepción de Santiago (el módulo dice esperar a probar la API de Fudo). Lint, tipos, los 85 archivos de test (798 tests) y build en verde, corridos por partes. `npm run e2e` por partes en primer plano, en verde entero en computadora y en celular. Dos migraciones (ventas; clave de carga y totales con lo anulado) aplicadas y verificadas en la base de pruebas; la reversa de la primera se probó en una transacción. El 2026-10-11, con el OK de Santiago, aplicadas y verificadas en la real (4 tablas, 7 policies, los 4 canales, nada para anon, 20 migraciones en las dos bases). Capturas de la lista y la carga revisadas en los dos tamaños. Revisión independiente: sus dos hallazgos importantes (el total no seguía al estado elegido; un toque repetido podía duplicar la venta) se arreglaron con su test; quedan ocho menores anotados. Queda para la parte de Fudo lo de la fila de pendientes |
| 31 | Módulo de reportes | 2026-10-12 | Lint, tipos, los 98 archivos de test (858 tests: 450 puros y 408 contra la base de pruebas) y build en verde, corridos por partes. `npm run e2e` entero en verde en computadora y en celular, por grupos en primer plano (un grupo en segundo plano se cortó por falta de memoria y se volvió a correr con el OK de Santiago). Una migración (cuatro funciones de lectura, solo admin) aplicada y verificada en la base de pruebas, con su reversa probada en una transacción. El 2026-10-12, con el OK de Santiago, aplicada y verificada en la real (cinco funciones, ninguna security definer, nada para anon, 21 migraciones en las dos bases). Capturas de ventas, productos, resultado y caja revisadas en los dos tamaños: se sacó la animación de los gráficos y la tabla de caja parte el texto en el celular. Revisión independiente: se arreglaron con su test el corte silencioso en 1000 filas, el signo del porcentaje contra un resultado negativo y el gráfico que caía a cero en los días que no pasaron. Santiago decidió el 2026-10-12 que sin fechas el reporte vaya del 1 a hoy y compare con los mismos días del mes anterior. Quedan seis menores anotados |
| 32 | Playwright sin ventana | 2026-10-12 | Pedido por Santiago mientras se hacía el 31. Las pruebas corren sin abrir la ventana (con `E2E_A_LA_VISTA=1` se ve) y conservan la pausa de 300 ms, porque sin ella seis pruebas tocaban antes de que cargara la página. Verificado con la corrida completa de `npm run e2e` del pedido 31, en verde y sin ventana |
| 33 | Módulo de inicio | 2026-10-12 | Lint, tipos, los 102 archivos de test (873 tests: 460 puros y 413 contra la base de pruebas) y build en verde, corridos por partes. `npm run e2e` entero en verde en computadora y en celular, por grupos en primer plano (un grupo de tests de base en segundo plano se cortó por falta de memoria y se volvió a correr con el OK de Santiago). Sin migraciones: usa el cálculo de Reportes. Capturas del inicio revisadas en los dos tamaños. Revisión independiente sin hallazgos críticos; se arreglaron con su test el monto de 8 cifras que se salía de la tarjeta en el celular (ahora una tarjeta por fila) y la prueba del aviso, que ahora comprueba que el gasto se ve en la lista. Se borró de la base de pruebas un cierre que había dejado una corrida fallida de la prueba de caja. Quedan seis menores anotados. Los avisos de Fudo quedan para el pedido 30 |
| 34 | Arreglos de la revisión lógica de la primera fase | 2026-10-12 | Lint, tipos, los 105 archivos de test (890 tests: 465 puros y 425 contra la base de pruebas) y build en verde, corridos por partes. `npm run e2e` entero en verde en computadora y en celular, por grupos en primer plano. Una migración (clave de carga de gastos, regla del efectivo de la caja en gastos y recurrentes, lo que quedó en el cierre anterior) aplicada y verificada en la base de pruebas, con la reversa probada en una transacción. El 2026-10-12, con el OK de Santiago, aplicada y verificada en la real (la clave y su índice, la regla en gastos y recurrentes, la función del control solo para usuarios con sesión, 22 migraciones en las dos bases). Capturas del control y de la carga de gastos revisadas. Revisión independiente: se arreglaron con su test el cambio de medio de un gasto de recurrente y un test que dejaba datos; lo de volver atrás no se reprodujo y quedó una prueba que lo fija. Quedan tres menores anotados. Sin decidir, con el cliente: a qué hora cierra el local (`docs/producto.md`). Al publicar: crear primero la cuenta del dueño en la base real |
| 35 | Sidebar y hero con la estética de Plan Reminder Pro | 2026-10-12 | Skill `estetica-panel` con la estética de Plan Reminder Pro y la marca de Manteca (crema y dorado, Manic y Neufile Grotesk). Sidebar en la computadora; en el celular, barra arriba y abajo con "Más". Hero con subtítulo en las pantallas principales. Por pedido de Santiago, el color principal pasa a ser el dorado en todo el sistema, con letra oscura. Lint, tipos, los 473 tests puros y build en verde; sin cambios en la base (los 425 de la base corridos sobre la misma rama, en verde). `npm run e2e` entero en verde en computadora y en celular, por grupos. Capturas revisadas en los dos tamaños. Revisión independiente: se arreglaron con su test que "Más" no se cerraba y que escondía el aviso de Usuarios; además el nombre largo en el celular y la opción elegida del selector de íconos. Quedan seis menores anotados |
| 25 | Módulo de menú digital | 2026-10-08 | `npm run verificar` en verde (lint, tipos, 494 tests de Vitest y build) y `npm run e2e` en verde (69 pruebas en computadora y 69 en celular, con las sesiones). Ocho migraciones aplicadas y verificadas en la base de pruebas (tablas, fotos, guardar, acciones, aumento, precios sin tocar, vista pública y carga inicial con los 35 productos) y, el 2026-10-08 con el OK de Santiago, en la real: 6 categorías, 35 productos y 35 filas públicas, RLS y policies iguales a pruebas, bucket creado y `list_migrations` con las mismas ocho. Capturas revisadas en los dos tamaños y la página comparada con mantecabakeryar.com. Revisión independiente hecha: se arreglaron con su test un descuento que encarecía, el mensaje de PM100, guardar un formulario viejo que revertía un aumento y el doble clic en Confirmar; los menores quedaron anotados. El botón de WhatsApp no se trajo: la página anterior no lo mostraba y tenía un número de relleno |
| 24 | Arreglos de la revisión de usuarios | 2026-10-08 | Cada arreglo con su test, que primero falló: corregir con un email que Supabase Auth rechaza no deja la acción viva; buscar `prueba_caja` no encuentra `prueba.caja` y un nombre con `_` sí se encuentra; un POST sin sesión recibe 303. `npm run verificar` en verde (348 tests) y `npm run e2e` en verde (77 pruebas). Sin migraciones. Que caja lea su local queda para Cierres de caja |
| 23 | Sacar la guía de estilos | 2026-10-07 | Página, componentes, pruebas y regla borrados. La prueba de acceso comprueba que `/admin/guia-de-estilos` da 404 y que el menú del admin queda en Inicio, Usuarios y Mi cuenta; entra en las corridas del pedido 22 |
| 1 | Repositorio privado en GitHub | 2026-10-06 | `gh repo view` confirma `Santucho12/sistema-manteca` como privado, con `main` sincronizada |
| 3 | Comparar skills con otros proyectos | 2026-10-06 | Se listaron las skills de los dos proyectos y se entregó la comparación |
| 4 | Traer seis skills | 2026-10-06 | Las seis están en `.claude/skills/` y Claude Code las carga |
| 5 | Reglas de código escritas | 2026-10-06 | Están en `CLAUDE.md` y en el paso 4 de `pre-finish` |
| 8 | Prueba con Playwright en el chequeo de cierre | 2026-10-06 | Es el paso 3 de `pre-finish`, obligatorio para dar un ítem por hecho |
| 9 | Registro de pedidos | 2026-10-06 | Este archivo, con su regla en `CLAUDE.md` |
| 10 | Que todo esto sea el flujo de trabajo habitual | 2026-10-06 | Sección "Flujo de trabajo habitual" de `CLAUDE.md`, que se carga en cada sesión |
| 11 | Análisis de preparación para empezar | 2026-10-06 | Análisis entregado en la conversación. No se modificó ninguna skill: las decisiones y los ajustes que surgieron quedan a definir |
| 12 | Dejar las skills listas para comenzar | 2026-10-06 | Cambios en `CLAUDE.md` y en las seis skills, verificados con siete pruebas de presión con subagentes: tres sobre el texto anterior, tres sobre el nuevo y una extra. Todas eligieron lo correcto; los huecos que marcaron se corrigieron. Encabezados de las skills validados |
| 13 | Sugerir el stack | 2026-10-06 | Sugerido y aprobado; quedó escrito en `CLAUDE.md`, sección "Stack", con los comandos del proyecto |
| 15 | Análisis en profundidad de todas las skills | 2026-10-06 | Análisis entregado en la conversación y correcciones aplicadas en `CLAUDE.md` y en las skills. La regla nueva sobre qué manda cuando otra skill o un plugin dice otra cosa se verificó con una prueba de presión: el subagente no creó las bases por el Marketplace de Vercel ni en una organización ajena |
| 16 | Commitear y pushear lo de hoy | 2026-10-06 | Un commit en `main` con `CLAUDE.md`, `PEDIDOS.md`, las seis skills y `.mcp.json`, subido al repo privado. Verificado con `git status` y con el commit visible en GitHub |
| 17 | Dos reglas nuevas en `CLAUDE.md` y nota en `tests-rls` | 2026-10-06 | Las dos reglas quedaron en `CLAUDE.md` ("Flujo de trabajo" y "Git") y la nota en `tests-rls`. Skills validadas y referencias cruzadas sin errores. Entra a `main` por PR |
| 18 | Enumerar las skills y el `CLAUDE.md` | 2026-10-06 | Enumeración entregada en la conversación |
| 20 | Acceso por MCP a Supabase, Vercel, GitHub y Playwright | 2026-10-06 | `supabase-pruebas` y `supabase-real` respondieron `list_tables` y `list_migrations` (las dos bases vacías y sin migraciones). El servidor de Playwright está aprobado en `.claude/settings.local.json`. GitHub funciona por `gh`. Vercel queda para cuando se publique |
| 19 | Armado del sistema | 2026-10-06 | `npm run verificar` (lint con formato, tipos, 77 tests de Vitest y build) y `npm run e2e` (36 pruebas de Playwright, en computadora y en celular) en verde; capturas de la guía revisadas en los dos tamaños. Pasó además por una revisión independiente; sus hallazgos importantes se corrigieron, cada uno con un test que primero falló. Quedó el proyecto Next.js con el lint controlando los límites de líneas, los tres tipos de test, las seis cuentas de prueba, los tokens de Manteca y la página `/admin/guia-de-estilos` |
| 14 | Descargar y configurar Playwright, en vivo | 2026-10-06 | `@playwright/test` instalado en el proyecto y configurado a la vista (`headless: false`, 300 ms, un navegador a la vez). `npm run e2e` corrió 36 pruebas en verde |
| 2 | Base de datos | 2026-10-06 | `.env.local` apunta al proyecto de pruebas y git no lo sigue. Los 20 tests contra la base pasan, y su preparación aborta si la URL no es la de pruebas (hay tests que lo comprueban, también con un `.env.test.local` que apunta a otra base). La base real no se tocó. Las tablas llegan con cada módulo |
| 6 | Tests reales contra la base de pruebas | 2026-10-06 | El grupo `base` de Vitest corre contra el proyecto de pruebas, sin mocks: 20 tests en verde dentro de `npm run verificar` |
| 7 | Guía de estilos dentro de la aplicación | 2026-10-06 | La página `/admin/guia-de-estilos` muestra colores, tipografías, radios, sombras, espaciados y componentes. 32 pruebas de Playwright en verde y capturas revisadas |

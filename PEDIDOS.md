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

### 39. Rediseño de Inicio y de la sidebar
Rediseño completo, desde cero, de la estética de Inicio (admin) y de la sidebar, con colores y estilo moderno a criterio de Claude (pedido de Santiago, 2026-10-21): sidebar oscura flotante, Inicio en bloques tipo bento, acento índigo. Los colores valen solo dentro del panel, el menú público no cambia. Sin cambios en qué hace cada pantalla.

### 38. Estética de Plan Reminder Pro en Inicio, Menú y Ventas
Llevar al cuerpo de Inicio, Menú y Ventas la estética de FiestaCobra (tarjetas con ícono, bloque oscuro de "Ventas del mes", paneles con cabecera, tabla, filtros en tarjeta, acciones como íconos), con los colores y la tipografía de Manteca. Diseño en `docs/superpowers/specs/2026-10-19-estetica-de-pantallas-design.md`.

**Excepción (Santiago, 2026-10-20):** Inicio lleva tarjetas blancas con letra negra, subtítulos grises y acentos verde, rojo y azul (no solo los colores de `globals.css`). La paleta pasa a la de la referencia de Santiago (los tokens HSL de `plan-reminder-pro`: fondo `210 20% 98%`, texto `220 40% 12%`, subtítulos `220 20% 45%`, bordes `220 20% 90%`) en toda la app, y las tarjetas de Inicio llevan borde y ícono verde, rojo y azul sobre blanco, con el bloque en azul marino. Quedó sin hacer: aplicar lo mismo a Menú y Ventas.

### 37. Ícono de la pestaña
La pestaña del navegador no muestra ningún ícono. Va la medialuna 🥐, como en la página de julio (decisión de Santiago, 2026-10-19).

## Pendientes

| # | Pedido | Qué falta |
|---|---|---|
| 38 | Estética de Plan Reminder Pro en Inicio, Menú y Ventas | Todo |
| 39 | Rediseño de Inicio y de la sidebar | Todo |
| 37 | Ícono de la pestaña | Hecho con su prueba en `src/app/icon.svg`. Falta que `npm run verificar` y `npm run e2e` den verde enteros: en la primera corrida dos archivos de tests de base se cortaron por tiempo y la segunda se frenó por falta de memoria |
| 36 | Publicar el sistema en el dominio | Cargar en Vercel las variables de la base real, volver a publicar, crear la cuenta del dueño en la base real y comprobar `/` y `/admin` en el dominio |
| 30 | Ventas: la parte de Fudo | Construida la parte a mano (ver Completados). Falta, cuando estén las credenciales: traer las ventas de Fudo, vincular productos y medios, "Actualizar ahora" y lo esperado en los cierres. En Reportes: mostrar hasta cuándo están sincronizadas las ventas, y resolver los descuentos de Fudo para que "por producto" cierre con "por período". En Inicio: los avisos "Productos de Fudo sin vincular" y "Las ventas no se sincronizan desde hace más de un día", y la fecha de la última sincronización |
| 21 | Arreglos de la revisión de la base técnica | Hecho y verificado (rama `fix/revision-base-tecnica`): montos sin precisión y URL sin cifrar se rechazan; protecciones de configuración (todo test corre en algún grupo, versión de Node, tipos de Supabase fuera de Prettier, clave secreta prohibida en componentes); la siembra repara cuentas y lee todas las páginas; un solo aviso con todas las variables que faltan; comprobación de tokens corregida; colores con contraste suficiente y anillo de foco entero. Los controles de 44 px, el campo con error y los títulos en Neufile Grotesk entraron con el pedido 22. Queda para el menú público: las tipografías en woff2. Las variantes de la guía ya no van: la guía se sacó en el pedido 23 |

## Completados

Los pedidos sin código de aplicación no tuvieron tests ni Playwright que correr: se anota
cómo se verificó cada uno.

| # | Pedido | Fecha | Cómo se verificó |
|---|---|---|---|
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
